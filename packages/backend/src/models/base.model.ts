/**
 * Base model with common attributes and methods
 */

import { Model, DataTypes, CreationOptional, InferAttributes, InferCreationAttributes } from 'sequelize';

export abstract class BaseModel<M extends Model = any> extends Model<
  InferAttributes<M>,
  InferCreationAttributes<M>
> {
  declare id: CreationOptional<string>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Common model attributes
  static getCommonAttributes() {
    return {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'created_at',
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'updated_at',
      },
    };
  }

  // Common model options
  static getCommonOptions() {
    return {
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    };
  }
}