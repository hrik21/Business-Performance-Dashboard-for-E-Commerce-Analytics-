/**
 * Supplier model definition
 */

import { DataTypes, Sequelize, Association } from 'sequelize';
import { BaseModel } from './base.model';
import { SupplyChainKPI } from './supply-chain-kpi.model';

export class Supplier extends BaseModel<Supplier> {
  declare name: string;
  declare contactEmail: string | null;
  declare contactPhone: string | null;
  declare address: string | null;
  declare performanceRating: number | null;
  declare isActive: boolean;

  // Associations
  declare supplyChainKPIs?: SupplyChainKPI[];
  declare static associations: {
    supplyChainKPIs: Association<Supplier, SupplyChainKPI>;
  };

  static initModel(sequelize: Sequelize): typeof Supplier {
    Supplier.init(
      {
        ...BaseModel.getCommonAttributes(),
        name: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        contactEmail: {
          type: DataTypes.STRING(255),
          allowNull: true,
          field: 'contact_email',
          validate: {
            isEmail: true,
          },
        },
        contactPhone: {
          type: DataTypes.STRING(50),
          allowNull: true,
          field: 'contact_phone',
        },
        address: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        performanceRating: {
          type: DataTypes.DECIMAL(3, 2),
          allowNull: true,
          field: 'performance_rating',
          validate: {
            min: 0,
            max: 5,
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
        modelName: 'Supplier',
        tableName: 'suppliers',
        ...BaseModel.getCommonOptions(),
      }
    );

    return Supplier;
  }

  static associate(): void {
    Supplier.hasMany(SupplyChainKPI, {
      foreignKey: 'supplierId',
      as: 'supplyChainKPIs',
    });
  }
}