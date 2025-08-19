/**
 * Sales Metric model definition
 */

import { DataTypes, Sequelize } from 'sequelize';
import { BaseModel } from './base.model';

export class SalesMetric extends BaseModel<SalesMetric> {
  declare timestamp: Date;
  declare revenue: number;
  declare orderCount: number;
  declare averageOrderValue: number;
  declare conversionRate: number;
  declare periodStart: Date;
  declare periodEnd: Date;
  declare granularity: 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year';
  declare productCategory: string | null;
  declare region: string | null;
  declare channel: string | null;

  static initModel(sequelize: Sequelize): typeof SalesMetric {
    SalesMetric.init(
      {
        ...BaseModel.getCommonAttributes(),
        timestamp: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        revenue: {
          type: DataTypes.DECIMAL(15, 2),
          allowNull: false,
          validate: {
            min: 0,
          },
        },
        orderCount: {
          type: DataTypes.INTEGER,
          allowNull: false,
          field: 'order_count',
          validate: {
            min: 0,
          },
        },
        averageOrderValue: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: false,
          field: 'average_order_value',
          validate: {
            min: 0,
          },
        },
        conversionRate: {
          type: DataTypes.DECIMAL(5, 4),
          allowNull: false,
          field: 'conversion_rate',
          validate: {
            min: 0,
            max: 1,
          },
        },
        periodStart: {
          type: DataTypes.DATE,
          allowNull: false,
          field: 'period_start',
        },
        periodEnd: {
          type: DataTypes.DATE,
          allowNull: false,
          field: 'period_end',
        },
        granularity: {
          type: DataTypes.ENUM('hour', 'day', 'week', 'month', 'quarter', 'year'),
          allowNull: false,
        },
        productCategory: {
          type: DataTypes.STRING(100),
          allowNull: true,
          field: 'product_category',
        },
        region: {
          type: DataTypes.STRING(100),
          allowNull: true,
        },
        channel: {
          type: DataTypes.STRING(100),
          allowNull: true,
        },
      },
      {
        sequelize,
        modelName: 'SalesMetric',
        tableName: 'sales_metrics',
        ...BaseModel.getCommonOptions(),
        indexes: [
          {
            fields: ['timestamp'],
          },
          {
            fields: ['period_start', 'period_end'],
          },
          {
            fields: ['granularity'],
          },
          {
            fields: ['product_category'],
          },
          {
            fields: ['region'],
          },
          {
            fields: ['channel'],
          },
          {
            fields: ['timestamp', 'product_category', 'region'],
          },
        ],
      }
    );

    return SalesMetric;
  }
}