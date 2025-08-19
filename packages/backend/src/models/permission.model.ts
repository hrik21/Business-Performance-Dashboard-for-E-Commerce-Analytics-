/**
 * Permission model definition
 */

import { DataTypes, Sequelize, Association } from 'sequelize';
import { BaseModel } from './base.model';
import { Role } from './role.model';

export class Permission extends BaseModel<Permission> {
  declare resource: string;
  declare action: 'read' | 'write' | 'delete' | 'admin';
  declare scope: string | null;

  // Associations
  declare roles?: Role[];
  declare static associations: {
    roles: Association<Permission, Role>;
  };

  static initModel(sequelize: Sequelize): typeof Permission {
    Permission.init(
      {
        ...BaseModel.getCommonAttributes(),
        resource: {
          type: DataTypes.STRING(100),
          allowNull: false,
        },
        action: {
          type: DataTypes.ENUM('read', 'write', 'delete', 'admin'),
          allowNull: false,
        },
        scope: {
          type: DataTypes.STRING(100),
          allowNull: true,
        },
      },
      {
        sequelize,
        modelName: 'Permission',
        tableName: 'permissions',
        ...BaseModel.getCommonOptions(),
        indexes: [
          {
            fields: ['resource'],
          },
          {
            unique: true,
            fields: ['resource', 'action', 'scope'],
          },
        ],
      }
    );

    return Permission;
  }

  static associate(): void {
    Permission.belongsToMany(Role, {
      through: 'role_permissions',
      foreignKey: 'permission_id',
      otherKey: 'role_id',
      as: 'roles',
    });
  }
}