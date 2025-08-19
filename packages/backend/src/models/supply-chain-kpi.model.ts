/**
 * Supply Chain KPI model definition
 */

import { DataTypes, Sequelize, Association } from 'sequelize';
import { BaseModel } from './base.model';
import { Product } from './product.model';
import { Warehouse } from './warehouse.model';
import { Supplier } from './supplier.model';

export class SupplyChainKPI extends BaseModel<SupplyChainKPI> {
  declare productId: string;
  declare warehouseId: string;
  declare supplierId: string;
  declare currentStock: number;
  declare reorderPoint: number;
  declare leadTime: number;
  declare supplierPerformance: number;
  declare fulfillmentRate: number;
  declare stockoutRisk: 'low' | 'medium' | 'high';
  declare averageDemand: number;
  declare lastUpdated: Date;

  // Associations
  declare product?: Product;
  declare warehouse?: Warehouse;
  declare supplier?: Supplier;
  declare static associations: {
    product: Association<SupplyChainKPI, Product>;
    warehouse: Association<SupplyChainKPI, Warehouse>;
    supplier: Association<SupplyChainKPI, Supplier>;
  };

  static initModel(sequelize: Sequelize): typeof SupplyChainKPI {
    SupplyChainKPI.init(
      {
        ...BaseModel.getCommonAttributes(),
        productId: {
          type: DataTypes.UUID,
          allowNull: false,
          field: 'product_id',
          references: {
            model: 'products',
            key: 'id',
          },
        },
        warehouseId: {
          type: DataTypes.UUID,
          allowNull: false,
          field: 'warehouse_id',
          references: {
            model: 'warehouses',
            key: 'id',
          },
        },
        supplierId: {
          type: DataTypes.UUID,
          allowNull: false,
          field: 'supplier_id',
          references: {
            model: 'suppliers',
            key: 'id',
          },
        },
        currentStock: {
          type: DataTypes.INTEGER,
          allowNull: false,
          field: 'current_stock',
          validate: {
            min: 0,
          },
        },
        reorderPoint: {
          type: DataTypes.INTEGER,
          allowNull: false,
          field: 'reorder_point',
          validate: {
            min: 0,
          },
        },
        leadTime: {
          type: DataTypes.INTEGER,
          allowNull: false,
          field: 'lead_time',
          validate: {
            min: 0,
          },
        },
        supplierPerformance: {
          type: DataTypes.DECIMAL(3, 2),
          allowNull: false,
          field: 'supplier_performance',
          validate: {
            min: 0,
            max: 1,
          },
        },
        fulfillmentRate: {
          type: DataTypes.DECIMAL(3, 2),
          allowNull: false,
          field: 'fulfillment_rate',
          validate: {
            min: 0,
            max: 1,
          },
        },
        stockoutRisk: {
          type: DataTypes.ENUM('low', 'medium', 'high'),
          allowNull: false,
          field: 'stockout_risk',
        },
        averageDemand: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: false,
          field: 'average_demand',
          validate: {
            min: 0,
          },
        },
        lastUpdated: {
          type: DataTypes.DATE,
          allowNull: false,
          field: 'last_updated',
          defaultValue: DataTypes.NOW,
        },
      },
      {
        sequelize,
        modelName: 'SupplyChainKPI',
        tableName: 'supply_chain_kpis',
        ...BaseModel.getCommonOptions(),
        indexes: [
          {
            fields: ['product_id'],
          },
          {
            fields: ['warehouse_id'],
          },
          {
            fields: ['supplier_id'],
          },
          {
            fields: ['stockout_risk'],
          },
          {
            fields: ['last_updated'],
          },
          {
            fields: ['product_id', 'warehouse_id', 'stockout_risk'],
          },
        ],
      }
    );

    return SupplyChainKPI;
  }

  static associate(): void {
    SupplyChainKPI.belongsTo(Product, {
      foreignKey: 'productId',
      as: 'product',
    });

    SupplyChainKPI.belongsTo(Warehouse, {
      foreignKey: 'warehouseId',
      as: 'warehouse',
    });

    SupplyChainKPI.belongsTo(Supplier, {
      foreignKey: 'supplierId',
      as: 'supplier',
    });
  }
}