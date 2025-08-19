/**
 * Customer Behavior model definition
 */

import { DataTypes, Sequelize, Association } from 'sequelize';
import { BaseModel } from './base.model';
import { CustomerSegment } from './customer-segment.model';

export class CustomerBehavior extends BaseModel<CustomerBehavior> {
  declare customerId: string;
  declare sessionId: string;
  declare pageViews: number;
  declare timeOnSite: number;
  declare purchaseIntent: number;
  declare segmentId: string | null;
  declare lifetimeValue: number;
  declare lastActivity: Date;
  declare acquisitionChannel: string;
  declare churnRisk: number;
  declare averageOrderValue: number;
  declare purchaseFrequency: number;

  // Associations
  declare segment?: CustomerSegment;
  declare static associations: {
    segment: Association<CustomerBehavior, CustomerSegment>;
  };

  static initModel(sequelize: Sequelize): typeof CustomerBehavior {
    CustomerBehavior.init(
      {
        ...BaseModel.getCommonAttributes(),
        customerId: {
          type: DataTypes.UUID,
          allowNull: false,
          field: 'customer_id',
        },
        sessionId: {
          type: DataTypes.STRING(255),
          allowNull: false,
          field: 'session_id',
        },
        pageViews: {
          type: DataTypes.INTEGER,
          allowNull: false,
          field: 'page_views',
          validate: {
            min: 0,
          },
        },
        timeOnSite: {
          type: DataTypes.INTEGER,
          allowNull: false,
          field: 'time_on_site',
          validate: {
            min: 0,
          },
        },
        purchaseIntent: {
          type: DataTypes.DECIMAL(3, 2),
          allowNull: false,
          field: 'purchase_intent',
          validate: {
            min: 0,
            max: 1,
          },
        },
        segmentId: {
          type: DataTypes.UUID,
          allowNull: true,
          field: 'segment_id',
          references: {
            model: 'customer_segments',
            key: 'id',
          },
        },
        lifetimeValue: {
          type: DataTypes.DECIMAL(12, 2),
          allowNull: false,
          field: 'lifetime_value',
          validate: {
            min: 0,
          },
        },
        lastActivity: {
          type: DataTypes.DATE,
          allowNull: false,
          field: 'last_activity',
        },
        acquisitionChannel: {
          type: DataTypes.STRING(100),
          allowNull: false,
          field: 'acquisition_channel',
        },
        churnRisk: {
          type: DataTypes.DECIMAL(3, 2),
          allowNull: false,
          field: 'churn_risk',
          validate: {
            min: 0,
            max: 1,
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
        purchaseFrequency: {
          type: DataTypes.DECIMAL(8, 4),
          allowNull: false,
          field: 'purchase_frequency',
          validate: {
            min: 0,
          },
        },
      },
      {
        sequelize,
        modelName: 'CustomerBehavior',
        tableName: 'customer_behavior',
        ...BaseModel.getCommonOptions(),
        indexes: [
          {
            fields: ['customer_id'],
          },
          {
            fields: ['session_id'],
          },
          {
            fields: ['segment_id'],
          },
          {
            fields: ['last_activity'],
          },
          {
            fields: ['churn_risk'],
          },
          {
            fields: ['acquisition_channel'],
          },
          {
            fields: ['customer_id', 'last_activity', 'segment_id'],
          },
        ],
      }
    );

    return CustomerBehavior;
  }

  static associate(): void {
    CustomerBehavior.belongsTo(CustomerSegment, {
      foreignKey: 'segmentId',
      as: 'segment',
    });
  }
}