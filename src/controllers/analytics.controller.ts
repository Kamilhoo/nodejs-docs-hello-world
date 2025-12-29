import { FastifyReply } from 'fastify';
import { AuthRequest } from '../types';
import { Order } from '../models/order.model';
import { Rug } from '../models/rug.model';
import { LiteUser } from '../models/liteUser.model';

type TimeRange =
  | 'today'
  | 'last_7_days'
  | 'last_month'
  | 'last_3_months'
  | 'last_year'
  | 'all_time';

interface AnalyticsQuery {
  time?: TimeRange;
}

const getRangeDates = (time?: TimeRange) => {
  const now = new Date();

  if (!time || time === 'all_time') {
    return { from: null as Date | null, to: now };
  }

  const to = now;
  const from = new Date(now);

  switch (time) {
    case 'today': {
      from.setHours(0, 0, 0, 0);
      break;
    }
    case 'last_7_days': {
      from.setDate(from.getDate() - 7);
      break;
    }
    case 'last_month': {
      from.setMonth(from.getMonth() - 1);
      break;
    }
    case 'last_3_months': {
      from.setMonth(from.getMonth() - 3);
      break;
    }
    case 'last_year': {
      from.setFullYear(from.getFullYear() - 1);
      break;
    }
  }

  return { from, to };
};

export const getOverviewAnalytics = async (
  request: AuthRequest,
  reply: FastifyReply
) => {
  try {
    const { time } = request.query as AnalyticsQuery;
    const { from, to } = getRangeDates(time);

    const orderDateFilter: Record<string, any> = {};
    const rugDateFilter: Record<string, any> = {};
    const userDateFilter: Record<string, any> = {};

    if (from) {
      orderDateFilter.createdAt = { $gte: from, $lte: to };
      rugDateFilter.createdAt = { $gte: from, $lte: to };
      userDateFilter.createdAt = { $gte: from, $lte: to };
    }

    // Core stats
    const [
      totalOrders,
      completedRevenueAgg,
      totalRugs,
      completedOrders,
      customerCount,
    ] = await Promise.all([
      // All orders in range
      Order.countDocuments(orderDateFilter),
      // Revenue from completed orders in range
      Order.aggregate([
        {
          $match: {
            status: 'completed',
            ...(orderDateFilter.createdAt
              ? { createdAt: orderDateFilter.createdAt }
              : {}),
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$totalPrice' },
          },
        },
      ]),
      // Rugs created in range
      Rug.countDocuments(rugDateFilter),
      // Completed orders count in range
      Order.countDocuments({
        ...orderDateFilter,
        status: 'completed',
      }),
      // Customer count from LiteUser table in range
      LiteUser.countDocuments(userDateFilter),
    ]);

    const totalRevenue =
      completedRevenueAgg.length > 0 ? completedRevenueAgg[0].total : 0;

    // Growth ratio (always based on completed orders, month vs previous month)
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonthStart = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      1
    );
    const previousMonthEnd = new Date(
      now.getFullYear(),
      now.getMonth(),
      0,
      23,
      59,
      59,
      999
    );

    const [
      currentCompletedOrders,
      previousCompletedOrders,
    ] = await Promise.all([
      Order.countDocuments({
        status: 'completed',
        createdAt: { $gte: currentMonthStart, $lte: now },
      }),
      Order.countDocuments({
        status: 'completed',
        createdAt: { $gte: previousMonthStart, $lte: previousMonthEnd },
      }),
    ]);

    let growthRatio = 0;
    if (previousCompletedOrders === 0) {
      growthRatio = currentCompletedOrders > 0 ? 1 : 0;
    } else {
      growthRatio =
        (currentCompletedOrders - previousCompletedOrders) /
        previousCompletedOrders;
    }

    return reply.status(200).send({
      success: true,
      time: {
        value: time || 'all_time',
        from: from ? from.toISOString() : null,
        to: to.toISOString(),
      },
      totalOrders,
      totalRevenue,
      totalRugs,
      completedOrders,
      customerCount,
      growthRatio,
      growth: {
        currentCompletedOrders,
        previousCompletedOrders,
      },
    });
  } catch (error: any) {
    console.error('Error fetching analytics overview:', error);
    return reply.status(500).send({
      success: false,
      message: 'Failed to fetch analytics overview',
    });
  }
};


