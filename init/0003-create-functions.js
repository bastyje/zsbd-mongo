db = db.getSiblingDB('insurance');

const runTransaction = (session, func) => {
    session.startTransaction();
    try {
        func();
        session.commitTransaction();
    } catch (error) {
        session.abortTransaction();
        throw error;
    }
}

db.system.js.insertOne({
    _id: 'runTransaction',
    value: runTransaction
});

const _fieldExists = (field, name) => {
    if (field === undefined || field === null) {
        throw new Error(`Field '${name}' is required`);
    }
}

db.system.js.insertOne({
    _id: '_fieldExists',
    value: _fieldExists
});

const _validateClaim = (claim) => {
    if (!claim) {
        throw new Error('Claim is required');
    }

    _fieldExists(claim.months_since_last_claim, 'months_since_last_claim');
    _fieldExists(claim.total_claim_amount, 'total_claim_amount');
}

db.system.js.insertOne({
    _id: '_validateClaim',
    value: _validateClaim
});

const _validatePolicy = (policy) => {
    if (!policy) {
        throw new Error('Policy is required');
    }

    _fieldExists(policy.number, 'number');
    _fieldExists(policy.user_id, 'user_id');
    _fieldExists(policy.vehicle_id, 'vehicle_id');
    _fieldExists(policy.coverage, 'coverage');
    _fieldExists(policy.effective_to_date, 'effective_to_date');
    _fieldExists(policy.monthly_premium_auto, 'monthly_premium_auto');
    _fieldExists(policy.months_since_policy_inception, 'months_since_policy_inception');
    _fieldExists(policy.policy_type, 'policy_type');
    _fieldExists(policy.policy, 'policy');
    _fieldExists(policy.renew_offer_type, 'renew_offer_type');
    _fieldExists(policy.sales_channel, 'sales_channel');
    _validateClaim(policy.claim)
}

db.system.js.insertOne({
    _id: '_validatePolicy',
    value: _validatePolicy
});

const _userExists = (userId) => {
    if (!db.customers.findOne({ _id: userId })) {
        throw new Error(`User with id ${userId} does not exist`);
    }
}

db.system.js.insertOne({
    _id: '_userExists',
    value: _userExists
});

const _vehicleExists = (vehicleId) => {
    if (!db.vehicles.findOne({ _id: vehicleId })) {
        throw new Error(`Vehicle with id ${vehicleId} does not exist`);
    }
}

db.system.js.insertOne({
    _id: '_vehicleExists',
    value: _vehicleExists
});

const _previousPolicyExists = (userId, vehicleId) => {
    if (!db.policies.findOne({user_id: userId, vehicle_id: vehicleId})) {
        throw new Error(`Policy for user ${userId} and vehicle ${vehicleId} does not exist, so it cannot be renewed`);
    }
}

db.system.js.insertOne({
    _id: '_previousPolicyExists',
    value: _previousPolicyExists
});

const _renewInsurance = (newPolicy) => {
    newPolicy.number = nextPolicyNumber();
    _validatePolicy(newPolicy);
    _userExists(newPolicy.user_id);
    _vehicleExists(newPolicy.vehicle_id);
    _previousPolicyExists(newPolicy.user_id, newPolicy.vehicle_id);
    db.policies.insertOne(newPolicy);
}

db.system.js.insertOne({
    _id: '_renewInsurance',
    value: _renewInsurance
});

const renewInsurance = (newPolicy) => {
    const session = db.getMongo().startSession();
    runTransaction(session, _ => _renewInsurance(newPolicy));
    session.endSession();
}

db.system.js.insertOne({
    _id: 'renewInsurance',
    value: renewInsurance
});

// example
renewInsurance({
    user_id: ObjectId('6750d56d011cd2687efe6911'),
    vehicle_id: ObjectId('6750d56d011cd2687efe691e'),
    coverage: 'Basic',
    effective_to_date: new Date(),
    monthly_premium_auto: 100,
    months_since_policy_inception: 1,
    policy_type: 'Corporate Auto',
    policy: 'Corporate',
    renew_offer_type: 'Offer1',
    sales_channel: 'Call Center',
    claim: {
        months_since_last_claim: 1,
        total_claim_amount: 100
    }
});

const _validateDemographic = (demographic) => {
    if (!demographic) {
        throw new Error('Demographic is required');
    }

    _fieldExists(demographic.education, 'education');
    _fieldExists(demographic.employment_status, 'employment_status');
    _fieldExists(demographic.gender, 'gender');
    _fieldExists(demographic.martial_status, 'martial_status');
}

db.system.js.insertOne({
    _id: '_validateDemographic',
    value: _validateDemographic
});

const _validateLocation = (location) => {
    if (!location) {
        throw new Error('Location is required');
    }

    _fieldExists(location.code, 'code');
    _fieldExists(location.state, 'state');
}

db.system.js.insertOne({
    _id: '_validateLocation',
    value: _validateLocation
});

const _validateBusiness = (business) => {
    if (!business) {
        throw new Error('Business is required');
    }

    _fieldExists(business.income, 'income');
    _fieldExists(business.number_of_policies, 'number_of_policies');
    _fieldExists(business.lifetime_value, 'lifetime_value');
    _fieldExists(business.response, 'response');
    _fieldExists(business.number_of_open_complaints, 'number_of_open_complaints');
}

db.system.js.insertOne({
    _id: '_validateBusiness',
    value: _validateBusiness
});

const _createCustomer = (customer) => {
    _fieldExists(customer.pseudonym, 'pseudonym');

    if (db.customers.findOne({ pseudonym: customer.pseudonym })) {
        throw new Error(`Customer with pseudonym ${customer.pseudonym} already exists`);
    }

    _validateDemographic(customer.demographic);
    _validateLocation(customer.location);
    _validateBusiness(customer.business);
    db.customers.insertOne(customer);
};

db.system.js.insertOne({
    _id: '_createCustomer',
    value: _createCustomer
});

const createCustomer = (customer) => {
    const session = db.getMongo().startSession();
    runTransaction(session, _ => _createCustomer(customer));
    session.endSession();
};

db.system.js.insertOne({
    _id: 'createCustomer',
    value: createCustomer
});

const _validateVehicle = (vehicle) => {
    if (!vehicle) {
        throw new Error('Vehicle is required');
    }

    _fieldExists(vehicle.vehicle_class, 'vehicle_class');
    _fieldExists(vehicle.vehicle_size, 'vehicle_size');
}

db.system.js.insertOne({
    _id: '_validateVehicle',
    value: _validateVehicle
});

const _createVehicle = (vehicle) => {
    _validateVehicle(vehicle);
    db.vehicles.insertOne(vehicle);
}

db.system.js.insertOne({
    _id: '_createVehicle',
    value: _createVehicle
});

const createVehicle = (vehicle) => {
    const session = db.getMongo().startSession();
    runTransaction(session, _ => _createVehicle(vehicle));
    session.endSession();
}

db.system.js.insertOne({
    _id: 'createVehicle',
    value: createVehicle
});

_policyDoesNotExist = (policyNumber) => {
    if (db.policies.findOne({ number: policyNumber })) {
        throw new Error(`Policy with number ${policyNumber} already exists`);
    }
}

db.system.js.insertOne({
    _id: '_policyDoesNotExist',
    value: _policyDoesNotExist
});

const _validateCustomer = (customer) => {
    if (!customer) {
        throw new Error('Customer is required');
    }

    _fieldExists(customer.pseudonym, 'pseudonym');
    _validateDemographic(customer.demographic);
    _validateLocation(customer.location);
    _validateBusiness(customer.business);

    if (db.customers.findOne({ pseudonym: customer.pseudonym })) {
        throw new Error(`Customer with pseudonym ${customer.pseudonym} already exists`);
    }
}

db.system.js.insertOne({
    _id: '_validateCustomer',
    value: _validateCustomer
});

const _createPolicy = (vehicle, customer, policy) => {
    _validateVehicle(vehicle);
    _validateCustomer(customer);
    _validatePolicy(policy);

    db.customers.insertOne(customer);
    db.vehicles.insertOne(vehicle);

    _policyDoesNotExist(policy.number);

    db.policies.insertOne(policy);
}

db.system.js.insertOne({
    _id: '_createPolicy',
    value: _createPolicy
});

const createPolicy = (vehicle, customer, policy) => {
    const session = db.getMongo().startSession();
    runTransaction(session, _ => _createPolicy(vehicle, customer, policy));
    session.endSession();
}

db.system.js.insertOne({
    _id: 'createPolicy',
    value: createPolicy
});

const calculatePenetration = (state, policy_type) => {
    const count = db.policies.aggregate([
        {
            $lookup: {
                from: 'customers',
                localField: 'user_id',
                foreignField: '_id',
                as: 'customer'
            }
        },
        {
            $match: {
                'customer.location.state': state,
                'policy_type': policy_type
            }
        },
        {
            $count: 'penetration'
        }
    ]).next().penetration;

    const total = db.policies.aggregate([
        {
            $lookup: {
                from: 'customers',
                localField: 'user_id',
                foreignField: '_id',
                as: 'customer'
            }
        },
        {
            $match: {
                'customer.location.state': state
            }
        },
            {
                $count: 'total'
            }
        ]).next().total;

    return count / total;
}

db.system.js.insertOne({
    _id: 'calculatePenetration',
    value: calculatePenetration
});

const calculateAverageIncome = (state) => {
    return db.customers.aggregate([
        {
            $match: {
                'location.state': state
            }
        },
        {
            $group: {
                _id: null,
                average_income: {
                    $avg: '$business.income'
                }
            }
        }
    ]).next().average_income;
}

db.system.js.insertOne({
    _id: 'calculateAverageIncome',
    value: calculateAverageIncome
});

const calculateAverageLifetimeValue = (state) => {
    return db.customers.aggregate([
        {
            $match: {
                'location.state': state
            }
        },
        {
            $group: {
                _id: null,
                average_lifetime_value: {
                    $avg: '$business.lifetime_value'
                }
            }
        }
    ]).next().average_lifetime_value;
}

db.system.js.insertOne({
    _id: 'calculateAverageLifetimeValue',
    value: calculateAverageLifetimeValue
});


const calculateTotalPoliciesByState = (state) => {
    return db.policies.aggregate([
        {
            $lookup: {
                from: 'customers',
                localField: 'user_id',
                foreignField: '_id',
                as: 'customer'
            }
        },
        {
            $match: {
                'customer.location.state': state
            }
        },
        {
            $count: 'total_policies'
        }
    ]).next().total_policies;
}

db.system.js.insertOne({
    _id: 'calculateTotalPoliciesByState',
    value: calculateTotalPoliciesByState
});


const calculateTotalIncomeByState = (state) => {
    return db.policies.aggregate([
        {
            $lookup: {
                from: 'customers',
                localField: 'user_id',
                foreignField: '_id',
                as: 'customer'
            }
        },
        {
            $match: {
                'customer.location.state': state
            }
        },
        {
            $group: {
                _id: null,
                total_income: {
                    $sum: '$monthly_premium_auto'
                }
            }
        }
    ]).next().total_income;
}

db.system.js.insertOne({
    _id: 'calculateTotalIncomeByState',
    value: calculateTotalIncomeByState
});

const calculatePoliciesShareByState = (state) => {
    const totalPolicies = db.policies.countDocuments();
    const totalPoliciesByState = calculateTotalPoliciesByState(state);
    return totalPoliciesByState / totalPolicies;
}

db.system.js.insertOne({
    _id: 'calculatePoliciesShareByState',
    value: calculatePoliciesShareByState
});

const calculateTotalIncome = () => {
    return db.policies.aggregate([
        {
            $group: {
                _id: null,
                total_income: {
                    $sum: '$monthly_premium_auto'
                }
            }
        }
    ]).next().total_income;
}

db.system.js.insertOne({
    _id: 'calculateTotalIncome',
    value: calculateTotalIncome
});

const calculateIncomeShareByState = (state) => {
    const totalIncome = calculateTotalIncome();
    const totalIncomeByState = calculateTotalIncomeByState(state);
    return totalIncomeByState / totalIncome;
}

db.system.js.insertOne({
    _id: 'calculateIncomeShareByState',
    value: calculateIncomeShareByState
});

const getPoliciesByState = (state) => {
    return db.policies.aggregate([
        {
            $lookup: {
                from: 'customers',
                localField: 'user_id',
                foreignField: '_id',
                as: 'customer'
            }
        },
        {
            $match: {
                'customer.location.state': state
            }
        },
        {
            $sort: {
                'customer.business.income': 1
            }
        }
    ]).toArray();
}

db.system.js.insertOne({
    _id: 'getPoliciesByState',
    value: getPoliciesByState
});