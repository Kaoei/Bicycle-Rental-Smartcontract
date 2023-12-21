import { Result, text, int64, Opt, StableBTreeMap, Void as AzleVoid, Canister, update, bool, query } from 'azle';

type Renter = {
    renterId: int64;
    renterUserId?: int64;
    rentTime: text,
    bicycleId?:int64,
};


type Bicycle = {
    bicycleId: int64;
    type: text;
    isAvailable: boolean;
    renterId?: int64;
};

type User = {
    userId: int64;
    userName: text;
    userAddress: text;
    userAge: int64;
};

// Function to generate a unique ID
function generateUniqueId(): int64 {
    const timestamp = Date.now();
    const randomNum = Math.floor(Math.random() * 1000);
    const idString = `${timestamp}${randomNum}`;
    return BigInt(idString);
}

const renterDB = StableBTreeMap<int64, Renter>(0);
const bicycleDB = StableBTreeMap<int64, Bicycle>(1);
const userDB = StableBTreeMap<int64, User>(2);

export default Canister({
    createUser: update([text, text, int64], int64, (name, address, age) => {
        const uniqueUserId = generateUniqueId();

        const newUser: User = {
            userId: uniqueUserId,
            userName: name,
            userAddress: address,
            userAge: age,
        };

        userDB.insert(uniqueUserId, newUser);

        return uniqueUserId;
    }),
    addBicycle: update([text, bool], int64, (type, isAvailable) => {
        const uniqueBicycleId = generateUniqueId();
    
        const newBicycle: Bicycle = {
            bicycleId: uniqueBicycleId,
            type: type,
            isAvailable: isAvailable,
        };
    
        bicycleDB.insert(uniqueBicycleId, newBicycle);
    
        return uniqueBicycleId;
    }),


    rentBicycle: update([int64, text], int64, (userId, time) => {
        const user = userDB.get(userId);
    
        if (user === null) {
            return Result.Err('User does not exist. Please create an account.');
        }
    
        const bicycleOpt = bicycleDB.get(BigInt(1));
    
        if (!bicycleOpt.Some) {
            return Result.Err('Bicycle does not exist.');
        }
    
        const bicycle = bicycleOpt.Some;
    
        if (!bicycle.isAvailable) {
            return Result.Err('Bicycle is currently unavailable.');
        }
    
        const uniqueRentId = generateUniqueId();
    
        const newRent: Renter = {
            renterId: uniqueRentId,
            renterUserId: userId,
            rentTime: time,
        };
    
        renterDB.insert(uniqueRentId, newRent);
    
        const updatedBicycle: Bicycle = {
            ...bicycle,
            isAvailable: false,
            renterId: userId,
        };
    
        bicycleDB.insert(BigInt(1), updatedBicycle);
    
        return uniqueRentId;
    }),
    
    returnBicycle: update([int64], bool, (userId) => {
        const bicycleOpt = bicycleDB.get(BigInt(1));
    
        if (!bicycleOpt.Some) {
            return Result.Err('Bicycle does not exist.');
        }
    
        const bicycle = bicycleOpt.Some;
        const renter = renterDB.get(userId);
    
        if (bicycle.renterId !== userId) {
            return Result.Err('User does not have the right to return this bicycle.');
        }
    
        const updatedBicycle: Bicycle = {
            ...bicycle,
            isAvailable: true,
            renterId: BigInt(1),
        };
    
        bicycleDB.insert(BigInt(1), updatedBicycle);
    
        return true;
    }),
    
});