const typeDefs = `

type PartBought {
    part: String
    cost: Int
}

type TechTip {
    id: ID
    link: String
    createdBy: User
}

type Customer {
    name: String
    phoneNumber: String
}

type Repair {
    id : ID
    defects: [String]
    repairType: String 
    repairedBy: String
    dateFixed: String
    dateBrought: String
    serviceCost: Int
    partsBought: [PartBought]
    imei: String
    serialNo: String
    device: Device
    variant: String
    customer: Customer
}

type Blog {
    id: ID
    content: String
    createdBy: User
    title: String
    thumbnail: String
    category: String
}

type Shipping {
    building: String
    suite: String
    street: String
    town: String
}

type MinifiedDevice {
    variant: Variant
    storage: ID
    color: ID
}

type FinancingRequestUser {
    id: ID
    device: MinifiedDevice
    financer: String
    status: String
}

type CartItem {
    id: ID
    variant: Variant
    device: Device
    storage: Storage
    color: Color
    onOffer: Boolean
}

type SaleInfo {
    id: ID
    saleVia: String
    payment: Payment
    customer: User
    customerName: String
    customerPhoneNumber: String
    delivery: Delivery
    recordedBy: User
    compliments: [String]
}

type Delivery {
    id: ID
    lat: String
    lng: String
    dispatchTime: String
    collectionTime: String
}

type Payment {
    mode: String
    amount: Int
    timestamp: String
    codes: [String]
    financing: String
}

type Order {
    id: ID
    variant: Variant
    device: Device
    storage:ID
    color: ID
    saleInfo: SaleInfo
    review: OrderReview
}

type OrderReview {
    rating: String
    review: String
    image: String
    date: String
    id: ID
}

type User {
    id: ID
    name: String
    email: String
    image: String
    verificationToken: String
    phoneVerified: Boolean
    cart: [CartItem]
    tradeIns: [BuyBack]
    orders: [Order]
    financingRequests: [FinancingRequestUser]    
    emailVerified: Boolean
    shipping: Shipping
    phoneNumber: String
    isAdmin: Boolean
    adminRights: [String]
    adminSince: String
    rulesSetBy: User
}

type Metadata {
    sourceType: String
    sourceName: String
    sourceDefects: [String]
    purchaseDate: String
    isRepaired: Boolean
    repairDate: String
    repairCost: Int
}

type OfferInfo {
    id: ID
    label: String   
    start: String
    end: String
    createdBy: User
    createdAt: String
}

type Offer {
    info: OfferInfo
    price: Int
}

type OfferLanding {
    info: OfferInfo
    devices: [Device]
}

type Device {
    id : ID
    serialNo: String
    imei: String
    variant: Variant
    storage: Storage
    color: Color
    metadata: Metadata
    buyBackPrice: Int
    grade: String
    status: String
    offer: Offer

    createdAt: String
}

type FinancingRequest {
    id: ID
    customer: User
    date: String
    financer: String
    status: String
}


type TechnicalSpecification {
    label: String
    value: String
}

type Variant {
    id: ID
    tradeInAllowed: Boolean
    deviceType: String
    brand: String
    model: String
    technicalSpecifications: [TechnicalSpecification]

    screenCost: Int
    bodyCost:Int
    frontCamCost: Int
    backCamCost: Int
    earpieceCost: Int
    mouthpieceCost: Int
    speakerCost: Int
    authCost: Int
    simTrayCost: Int
    motherBoardCost: Int
    batteryCost: Int

    colors: [Color]
    storages: [Storage]  
    removed: Boolean
    financing: [String]
    featured: Boolean

    reviews: [Review]
  
}

type Color {
    label: String
    colorCode: String
    images:[String]
    primaryIndex: Int
    availableStorages: [String]
    id: ID
}

type Storage {
    label: String
    price: Int
    availableColors: [String]
    id: ID
}

type Review {
    id: ID
    rating: Int
    review: String
    image: String
    date: String
    
    customer: User
    product: Variant
    featured: Boolean
    removed: Boolean
}

type ColorOption {
    color: Color
    deviceIDs: [ID]
}

type StorageOption {
    storage: String
    deviceIDs: [ID]
}

type DeviceResponse {
    id: ID
    images: [String]
    description: String
    financing: [String]
    currentPrice : Int
    slashedPrice: Int
    brand: String
    model: String
    storage: String
    color: String
    technicalInfo: [TechnicalSpecification]
    comesWith: [String]
    imei: String
    serialNo: String
    colorOptions: [ColorOption]
    storageOptions : [StorageOption]
    saleInfo: SaleInfo
}


type BuyBack {
    id: ID!
    user: User
    variant: Variant
    storage: String
    color: String
    batteryHealth: Int
    frontCamOk: Boolean
    backCamOk: Boolean
    earpieceOk: Boolean
    mouthpieceOk: Boolean
    speakerOk: Boolean
    authorizationOk: Boolean
    simTrayPresent: Boolean
    chargingOk: Boolean
    screenCondition: String
    sideNBackCondition: String   
    offer: Int 
    createdAt: String
    payment: Payment
    cancelled: Boolean
}

type Payment {
    phoneNumber: String
    mode: String
    amount: Int
    timestamp: String
    code: String  
}



type Landing {
    runningOffers : [OfferLanding]
    bestSellers: [Variant]
    carousels: [Carousel]
}

type Sale {
    variant: String
    color: String
    storage: String
    imei: String
    serialNo: String
    purchasePrice: Int
    repairCost: Int
    salePrice: Int
    saleDate: String
    customerName: String
    customerPhoneNumber: String
    margin: Int
    financer: String  
    saleVia: String
    recordedBy: User
}

type FinancingRequestAdmin {
    id: ID
    device: MinifiedDevice
    financer: String
    status: String
    date: String
    customer: User
}


type Customer {
    id: ID
    name: String
    phoneNumber: String
    email: String
    cart: [Device]
    purchases: [Sale]
    financingRequests: [FinancingRequestAdmin]
}


type Carousel {
    createdBy: User
    smallScreen: String
    largeScreen: String
    link: String
    createdAt: String  
    id: ID
}


    type DaySale {
        date: String
        sales: Int
    }

    type MonthSale {
        month: String
        sales: Int
    }

    type DonutData {
        name: String
        value: Int
        color: String
    }

    type BrandSale {
        brand: String
        sales: Int
    }

    type ModelSale{
        model: String
        sales: Int
    }

  type SalesStatistics {
    weeklySales: [DaySale]
    monthlySales: [MonthSale]
    saleByType: [DonutData]
    financingRequests: [DonutData]
    saleByBrand: [BrandSale]
    saleByModel: [ModelSale]
  }

  type Mailing {
    id: ID
    email: String
  }


type Query {
    getFeatured: [Variant]
    getBlogs: [Blog]
    getBlog(id: ID) : Blog
    getTechTips: [TechTip]
    getFeaturedReviews: [Review]
    getReviews: [Review]
    testMail: String
    testSheets: String
    getSalesStatistics: SalesStatistics
    getCarousels: [Carousel]
    getAllOrders:[Order]    
    getDevice(id:ID): Device
    getUser(email: String): User
    getVariants : [Variant]
    getVariant(id: ID): Variant
    getDevices: [Device]
    getBuyBacks : [BuyBack]
    getOffers: [OfferLanding]
    getRunningOffers: [OfferLanding]


    getRepairs: [Repair]
    getCustomers : [User]
    getSales: [Sale]
    getAllFinancingRequests : [FinancingRequestAdmin]
    getAdmins: [User]
    getSuggestions (brand: String): [Variant]
    getCustomerInfoAdmin(id: ID): [Customer]
    getAvailableDevices(
        variant: ID
        storage: ID
        color: ID
    ) : [Device]
}

type Mutation {

    featureVariant(
        variant: ID
    ) : Variant

    updateBlog(
        id: ID
        content: String
        title: String
        thumbnail: String
        category: String
    ) : Blog

    addBlog(
        content: String
        createdBy: ID
        title: String
        thumbnail: String
        category: String
    ) : Blog

    removeBlog(id: ID) : Blog

    deleteTechTip(
        id: String
    ) : TechTip

    addTechTip (
        link: String
        createdBy: String
    ): TechTip

    updateReview (
        reviewId: ID
        featured: Boolean
        removed: Boolean
    ) : Review

    saveReview (
        review: String
        rating: Int
        image: String
        orderId: ID        
    ): User

    sendMail: String
    
    addMailing(
        email: String
    ) : Mailing

    editDevice(
        id: ID
        imei: String
        variant: ID
        storage: ID
        color: ID
        metadata: String
        serial: String
        buyBackPrice: Int
        grade: String
    ): Device

    createRepair(
        repairType: String    
        dateBrought: String
        imei: String
        variant: String
        serialNo: String
        customerName: String
        customerPhoneNumber: String
        defects: [String]
    ) : Repair

    approveFinancingRequest(
        request: ID
        txCodes: [String]
        paymentMode: String
        amount: Int    
    ) : FinancingRequestAdmin

    cancelFinancingRequest(
        request: ID     
    ) : FinancingRequestAdmin

    updateVariant (
        id: ID!
        tradeInAllowed: Boolean
        deviceType: String
        brand: String
        model: String
        technicalSpecifications: String
    
        screenCost: Int
        bodyCost:Int
        frontCamCost: Int
        backCamCost: Int
        earpieceCost: Int
        mouthpieceCost: Int
        speakerCost: Int
        authCost: Int
        simTrayCost: Int
        motherBoardCost: Int
        batteryCost: Int
        colors: String
        storages: String
      
        financing: [String]
        featured: Boolean
    ) : Variant

    sendVerificationToken ( id: ID ) : String

    completeVerification (
        id: ID
        otp: String
    ) : User

    sendSMS : String

    removeFromOffer (
        id: ID
    ) : Device

    completeBuyback (
        id: ID
        variant: ID
        color: String
        storage: String
        batteryHealth: Int
        frontCamOk: Boolean
        backCamOk: Boolean
        earpieceOk: Boolean
        mouthpieceOk: Boolean
        speakerOk: Boolean
        authorizationOk: Boolean
        simTrayPresent: Boolean
        chargingOk: Boolean
        screenCondition: String
        sideNBackCondition: String
        offer: Int
        defects: [String]
        imei: String
        serialNo: String
        grade: String
        customerName: String
        customerPhone: String
    ) : BuyBack

    createCarousel (
        smallScreen: String
        largeScreen: String
        link: String
        createdBy: String      
    ) : Carousel

    removeCarousel (
        id: ID
    ) : Carousel

    addAdmin (
        id: ID
    ) : User

    removeAdmin (
        id: ID
    ): User

    editRights (
        rights:[String]
        id: String
        changedBy: String
    ) : User

    collectOrder (
        orderId: ID
    ) : Order

    createFinancingRequest (
        customer: String
        cart: String
        financer: String
    ) : User

    sellDevice(
        deviceId: ID
        customerName: String
        customerPhoneNumber: String
        customerId: ID
        compliments: [String]
        sellPrice: Int
        sellDate: String
        financingOption: String     
        txCodes: [String]
        paymentMode: String        
    ) : Device

    removeVariant(id: ID) : Variant

    editProfile(
        name: String
        phoneNumber: String
        id: ID     
    ) : User

    dispatchOrder (
        deviceId: ID
        orderId : ID
    ): Order
    
    orderCollected (
        deviceId: ID
    ): Device  


    setDeviceonOffer (
        offerId: ID
        deviceId: ID
        price: Int
    ) : Device

    createOffer (
        label:String
        start: String
        end: String
        createdBy: String
    ) :  OfferLanding


    createVariant (
        tradeInAllowed: Boolean
        deviceType: String
        brand: String
        model: String
        technicalSpecifications: String

        screenCost: Int
        bodyCost:Int
        frontCamCost: Int
        backCamCost: Int
        earpieceCost: Int
        mouthpieceCost: Int
        speakerCost: Int
        authCost: Int
        simTrayCost: Int
        motherBoardCost: Int
        batteryCost: Int

        colors: String
        storages: String      
        financing: [String]
    ) : Variant

    createDevice (
        imei: String
        serial: String
        variant: ID   
        images: [String]
        publicAvailability: Boolean       
        offerId: ID
        offerReduction: String
        offerValue: Int
        comesWith: [String]
        storage: String
        color: String
        metadata: String
        buyBackPrice: Int
        grade: String
        price: Int
        description: String
    ): Device

    addToCart (
        email: String
        variant: ID
        storage: ID
        color: ID
        device: ID
    ) : User

    removeFromCart (
        email: String
        id: ID
    ): User

    editShipping (
        id: ID
        building: String
        suite: String
        street: String
        town: String
    ) : User

    createBuyBack (
        email: String      
        model: String
        storage: String
        batteryHealth: Int
        frontCamOk: Boolean
        backCamOk: Boolean
        earpieceOk: Boolean
        mouthpieceOk: Boolean
        speakerOk: Boolean
        authorizationOk: Boolean
        simTrayPresent: Boolean
        chargingOk: Boolean
        screenCondition: String
        sideNBackCondition: String
        offer: Int
    ) : BuyBack

   updateRepair (
        id: ID
        partsBought: String
        serviceCost: Int
        repairedBy: String
        dateFixed: String
    ) : Repair

    updateBuyBack (
        cancel: Boolean
        id: ID!
        variant: ID
        storage: String
        batteryHealth: Int
        frontCamOk: Boolean
        backCamOk: Boolean
        earpieceOk: Boolean
        mouthPieceOk: Boolean
        speakerOk: Boolean
        authorizationOk: Boolean
        simTrayPresent: Boolean
        chargingOk: Boolean
        screenCondition: String
        sideNBackCondition: String
        offer: Int
    ) : BuyBack

    toggleVisibility (
        id: ID
        images: [String]
        price: Int
        description: String
        compliments: [String]
    ) : Device
}

`

export default typeDefs
