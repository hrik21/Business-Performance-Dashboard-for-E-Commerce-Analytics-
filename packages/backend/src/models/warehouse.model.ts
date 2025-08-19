/**
 * Warehouse model definition
 */

import { DataTypes, Sequelize, Association } from 'sequelize';
import { BaseModel } from './base.model';
import { SupplyChainKPI } from './supply-chain-kpi.model';

export class Warehouse extends BaseModel<Warehouse> {
  declare name: string;
  declare location: string;
  declare address: string | null;
  declare capacity: number | null;
  declare isActive: boolean;

  // Associations
  declare supplyChainKPIs?: SupplyChainKPI[];
  declare static associations: {
    supplyChainKPIs: Association<Warehouse, SupplyChainKPI>;
  };

  static initModel(sequelize: Sequelize): typeof Warehouse {
    Warehouse.init(
      {
        ...BaseModel.getCommonAttributes(),
        name: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        location: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        address: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        capacity: {
          type: DataTypes.INTEGER,
          allowNull: true,
          validate: {
            min: 1,
          },
        },
        isActive: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true,
          field: 'is_active',
        },
      },
      {
        sequelize,
        modelName: 'Warehouse',
        tableName: 'warehouses',
        ...BaseModel.getCommonOptions(),
      }
    );

    return Warehouse;
  }

  static associate(): void {
    Warehouse.hasMany(SupplyChainKPI, {
      foreignKey: 'warehouseId',
      as: 'supplyChainKPIs',
    });
  }
}