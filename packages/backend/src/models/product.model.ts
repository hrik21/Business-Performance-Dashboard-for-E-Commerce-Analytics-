/**
 * Product model definition
 */

import { DataTypes, Sequelize, Association } from 'sequelize';
import { BaseModel } from './base.model';
import { SupplyChainKPI } from './supply-chain-kpi.model';

export class Product extends BaseModel<Product> {
  declare name: string;
  declare sku: string;
  declare category: string | null;
  declare unitCost: number | null;
  declare unitPrice: number | null;
  declare weight: number | null;
  declare dimensions: object | null;
  declare isActive: boolean;

  // Associations
  declare supplyChainKPIs?: SupplyChainKPI[];
  declare static associations: {
    supplyChainKPIs: Association<Product, SupplyChainKPI>;
  };

  static initModel(sequelize: Sequelize): typeof Product {
    Product.init(
      {
        ...BaseModel.getCommonAttributes(),
        name: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        sku: {
          type: DataTypes.STRING(100),
          allowNull: false,
          unique: true,
        },
        category: {
          type: DataTypes.STRING(100),
          allowNull: true,
        },
        unitCost: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: true,
          field: 'unit_cost',
          validate: {
            min: 0,
          },
        },
        unitPrice: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: true,
          field: 'unit_price',
          validate: {
            min: 0,
          },
        },
        weight: {
          type: DataTypes.DECIMAL(8, 3),
          allowNull: true,
          validate: {
            min: 0,
          },
        },
        dimensions: {
          type: DataTypes.JSONB,
          allowNull: true,
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
        modelName: 'Product',
        tableName: 'products',
        ...BaseModel.getCommonOptions(),
        indexes: [
          {
            unique: true,
            fields: ['sku'],
          },
          {
            fields: ['category'],
          },
          {
            fields: ['is_active'],
          },
        ],
      }
    );

    return Product;
  }

  static associate(): void {
    Product.hasMany(SupplyChainKPI, {
      foreignKey: 'productId',
      as: 'supplyChainKPIs',
    });
  }
}