/**
 * Customer Segment model definition
 */

import { DataTypes, Sequelize, Association } from 'sequelize';
import { BaseModel } from './base.model';
import { CustomerBehavior } from './customer-behavior.model';

export class CustomerSegment extends BaseModel<CustomerSegment> {
  declare name: string;
  declare description: string | null;
  declare criteria: object;

  // Associations
  declare customers?: CustomerBehavior[];
  declare static associations: {
    customers: Association<CustomerSegment, CustomerBehavior>;
  };

  static initModel(sequelize: Sequelize): typeof CustomerSegment {
    CustomerSegment.init(
      {
        ...BaseModel.getCommonAttributes(),
        name: {
          type: DataTypes.STRING(100),
          allowNull: false,
          unique: true,
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        criteria: {
          type: DataTypes.JSONB,
          allowNull: false,
        },
      },
      {
        sequelize,
        modelName: 'CustomerSegment',
        tableName: 'customer_segments',
        ...BaseModel.getCommonOptions(),
      }
    );

    return CustomerSegment;
  }

  static associate(): void {
    CustomerSegment.hasMany(CustomerBehavior, {
      foreignKey: 'segmentId',
      as: 'customers',
    });
  }
}