module.exports = (sequelize, DataTypes) => {
    const AdminUsers = sequelize.define('AdminUsers', {
        username: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true
            }
        },
        passwordHash: {
            type: DataTypes.STRING,
            allowNull: false
        },
        role: {
            type: DataTypes.STRING,
            defaultValue: 'admin' // superadmin, admin, viewer
        },
        regencyId: {
            type: DataTypes.INTEGER,
            allowNull: true // null = superadmin (akses semua kabupaten)
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        lastLoginAt: {
            type: DataTypes.DATE,
            allowNull: true
        }
    }, {
        tableName: 'AdminUsers'
    });

    AdminUsers.associate = (models) => {
        AdminUsers.belongsTo(models.Regencies, {
            foreignKey: 'regencyId',
            as: 'regency'
        });
    };

    return { AdminUsers };
};
