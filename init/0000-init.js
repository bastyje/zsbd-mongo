db = db.getSiblingDB("admin");
db.createUser({
    user: "user",
    pwd: "1234",
    roles: [
        { role: "readWrite", db: "admin" },
        { role: "readWrite", db: "insurance" },
    ],
});

