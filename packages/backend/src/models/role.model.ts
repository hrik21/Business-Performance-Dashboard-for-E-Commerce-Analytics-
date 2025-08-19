/**
 * Role model definition
 */

import { DataTypes, Sequelize, Association } from 'sequelize';
import { BaseModel } from './base.model';
import { Permission } from './permission.model';

export class Role extends BaseModel<Role> {
  declare name: string;
  declare description: string | null;

  // Associations
  declare permissions?: Permission[];
  declare static associations: {
    permissions: Association<Role, Permission>;
  };

  static initModel(sequelize: Sequelize): typeof Role {
    Role.init(
      {
        ...BaseModel.getCommonAttributes(),
        name: {
          type: DataTypes.STRING(50),
          allowNull: false,
          unique: true,
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
      },
      {
        sequelize,
        modelName: 'Role',
        tableName: 'roles',
        ...BaseModel.getCommonOptions(),
      }
    );

    return Role;
  }

  static associate(): void {
    Role.belongsToMany(Permission, {
      through: 'role_permissions',
      foreignKey: 'role_id',
      otherKey: 'permission_id',
      as: 'permissions',
    });
  }
}