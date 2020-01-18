const Sequelize=require("sequelize");

const database=new Sequelize("Meta-Registration","admin","shashank",{
    host:"localhost",
    dialect:"sqlite",
    storage:'registration.db',
    logging:false
});

const Customers=database.define("customers",{
    OrderId: {
        type: Sequelize.STRING,
        allowNull: false
    },
    Name:{
        type:Sequelize.STRING,
        allowNull:false
    },
    Email:{
        allowNull:false,
        type:Sequelize.STRING
    },
    Mobile:{
        type:Sequelize.INTEGER,
        allowNull:false
    },
    Branch:{
        type:Sequelize.STRING,
        allowNull:false
    },
    Year:{
        type:Sequelize.INTEGER,
        allowNull:false
    },
    Event:{
        type:Sequelize.STRING,
        allowNull:false
    },
    Amount:{
        type:Sequelize.INTEGER,
        allowNull:false
    }
});


module.exports={
    database,
    Customers
}
