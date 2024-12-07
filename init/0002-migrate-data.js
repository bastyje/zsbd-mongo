const fs = require('fs');
const path = require('path');

const filePath = path.join('/tmp/dataset', 'AutoInsurance.csv');

// - csv name - db name - entity
// - Customer - pseudonym - customer
// - State - state - customer
// - Customer Lifetime Value - lifetime_value - customer
// - Response - response - customer
// - Coverage - coverage - policy
// - Education - education - customer
// - Effective To Date - effective_to_date - policy
// - EmploymentStatus - employment_status - customer
// - Gender - gender - customer
// - Income - income - customer
// - Location Code - location - customer
// - Marital Status - marital_status - customer
// - Monthly Premium Auto - monthly_premium_auto - policy
// - Months Since Last Claim - months_since_last_claim - policy
// - Months Since Policy Inception - months_since_policy_inception - policy
// - Number of Open Complaints - number_of_open_complaints - policy
// - Number of Policies - number_of_policies - customer
// - Policy Type - policy_type - policy
// - Policy - policy - policy
// - Renew Offer Type - renew_offer_type - policy
// - Sales Channel - sales_channel - policy
// - Total Claim Amount - total_claim_amount - policy
// - Vehicle Class - vehicle_class - vehicle
// - Vehicle Size - vehicle_size - vehicle

const rawData = fs.readFileSync(filePath, { encoding: 'utf-8' })
    .split('\n')
    .map(row => row.split(','));

const headers = rawData.shift();

const data = rawData.map(row => {
    const obj = {};
    row.forEach((value, index) => {
        obj[headers[index]] = value;
    });
    return obj;
});

db = db.getSiblingDB('insurance');

db.counters.insertOne({
    _id: 'policy_number',
    seq: 0
});

const nextPolicyNumber = () => {
    const ret = db.counters.findOneAndUpdate(
        { _id: 'policy_number' },
        { $inc: { seq: 1 } },
        { returnNewDocument: true }
    );
    return ret.seq;
}

db.system.js.insertOne({
    _id: 'nextPolicyNumber',
    value: nextPolicyNumber
});

for (const row of data) {
    var customerId = ObjectId();
    db.customers.insertOne({
        _id: customerId,
        pseudonym: row.Customer,
        demographic: {
            education: row.Education,
            employment_status: row.EmploymentStatus,
            gender: row.Gender,
            martial_status: row['Marital Status']
        },
        location: {
            code: row['Location Code'],
            state: row.State,
        },
        business: {
            income: parseFloat(row.Income),
            number_of_policies: parseInt(row['Number of Policies']),
            lifetime_value: parseFloat(row['Customer Lifetime Value']),
            response: row.Response,
            number_of_open_complaints: parseInt(row['Number of Open Complaints']),
        }
    });

    var vehicleId = ObjectId();
    db.vehicles.insertOne({
        _id: vehicleId,
        vehicle_class: row['Vehicle Class'],
        vehicle_size: row['Vehicle Size']
    });

    db.policies.insertOne({
        user_id: customerId,
        vehicle_id: vehicleId,
        number: nextPolicyNumber(),
        coverage: row.Coverage,
        effective_to_date: new Date(row['Effective To Date']),
        monthly_premium_auto: parseFloat(row['Monthly Premium Auto']),
        months_since_policy_inception: parseInt(row['Months Since Policy Inception']),
        policy_type: row['Policy Type'],
        policy: row.Policy,
        renew_offer_type: row['Renew Offer Type'],
        sales_channel: row['Sales Channel'],
        claim: {
            months_since_last_claim: parseInt(row['Months Since Last Claim']),
            total_claim_amount: parseFloat(row['Total Claim Amount']),
        }
    });
}

db.customers.createIndex({ 'location.state': 1 });
db.customers.createIndex({ 'business.income': 1 });
db.customers.createIndex({ 'location.state': 1, 'business.income': 1 });
db.policies.createIndex({ user_id: 1 });
db.policies.createIndex({ number: 1 });
db.policies.createIndex({ effective_to_date: 1 });
db.policies.createIndex({ 'claim.total_claim_amount': 1 });
db.policies.createIndex({ 'claim.months_since_last_claim': 1 });
db.vehicles.createIndex({ vehicle_class: 1 });
db.vehicles.createIndex({ vehicle_size: 1 });

