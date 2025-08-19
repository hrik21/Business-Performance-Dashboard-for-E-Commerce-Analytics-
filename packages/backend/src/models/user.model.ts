/**
 * User model definition
 */

import { DataTypes, Sequelize, Association } from 'sequelize';
import { BaseModel } from './base.model';
import { Role } from './role.model';

export class User extends BaseModel<User> {
  declare email: string;
  declare passwordHash: string;
  declare firstName: string;
  declare lastName: string;
  declare roleId: string | null;
  declare isActive: boolean;
  declare lastLogin: Date | null;

  // Associations
  declare role?: Role;
  declare static associations: {
    role: Association<User, Role>;
  };

  // Instance methods
  getFullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  isAdmin(): boolean {
    return this.role?.name === 'admin';
  }

  static initModel(sequelize: Sequelize): typeof User {
    User.init(
      {
        ...BaseModel.getCommonAttributes(),
        email: {
          type: DataTypes.STRING(255),
          allowNull: false,
          unique: true,
          validate: {
            isEmail: true,
          },
        },
        passwordHash: {
          type: DataTypes.STRING(255),
          allowNull: false,
          field: 'password_hash',
        },
        firstName: {
          type: DataTypes.STRING(100),
          allowNull: false,
          field: 'first_name',
        },
        lastName: {
          type: DataTypes.STRING(100),
          allowNull: false,
          field: 'last_name',
        },
        roleId: {
          type: DataTypes.UUID,
          allowNull: true,
          field: 'role_id',
          references: {
            model: 'roles',
            key: 'id',
          },
        },
        isActive: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true,
          field: 'is_active',
        },
        lastLogin: {
          type: DataTypes.DATE,
          allowNull: true,
          field: 'last_login',
        },
      },
      {
        sequelize,
        modelName: 'User',
        tableName: 'users',
        ...BaseModel.getCommonOptions(),
        indexes: [
          {
            fields: ['email'],
          },
          {
            fields: ['role_id'],
          },
          {
            fields: ['is_active'],
          },
        ],
      }
    );

    return User;
  }

  static associate(): void {
    User.belongsTo(Role, {
      foreignKey: 'roleId',
      as: 'role',
    });
  }
}