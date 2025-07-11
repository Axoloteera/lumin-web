import { Model, DataTypes, InferAttributes, InferCreationAttributes, CreationOptional, ForeignKey, Sequelize } from 'sequelize';
import { User } from './user';
import { File } from './file';

export interface ProjectAttributes {
  id: CreationOptional<number>;
  name: string;
  description: string;
  userId: ForeignKey<User['id']>;
  githubRepo: string;
  githubOwner: string;
}

export class Project extends Model<InferAttributes<Project>, InferCreationAttributes<Project, { omit: 'id' }>> {
  declare id: CreationOptional<number>;
  declare name: CreationOptional<string>;
  declare description: CreationOptional<string>;
  declare userId: ForeignKey<User['id']>;
  declare domain: CreationOptional<string>
  declare hasIndex: CreationOptional<boolean>
  declare githubRepo: CreationOptional<string>
  declare githubOwner: CreationOptional<string>
}

export const init = (sequelize: Sequelize) => Project.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "未命名"
    },
    domain: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: ""
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    hasIndex: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    githubRepo: {
      type: DataTypes.STRING,
      allowNull: true
    },
    githubOwner: {
      type: DataTypes.STRING,
      allowNull: true
    }
  },
  {
    sequelize,
    tableName: 'projects',
    timestamps: true,
    hooks: {
      afterCreate: async (project, options) => {
        console.log("创建作品")
        await File.create(
          {
            name: 'Root',
            folder: true,
            projectId: project.id,
            parentId: null,
          },
          { transaction: options.transaction } // 确保在同一事务中
        );
      },
    },
  }
);
