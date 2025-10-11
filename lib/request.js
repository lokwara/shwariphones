const GET_DEVICE = `
query GetDevice($getDeviceId: ID) {
  getDevice(id: $getDeviceId) {
    color {
      colorCode
      label
      images
    }
    offer {
      price
    }
    storage {
      label
      price
    }
    variant {
      id
      brand
      model
      technicalSpecifications {
        label
        value
      }
      deviceType
    }
  }   
}
`

const CREATE_DEVICE = `
mutation CreateDevice($imei: String, $variant: ID, $color: String, $metadata: String, $buyBackPrice: Int, $grade: String, $price: Int, $serial: String, $storage: String) {
  createDevice(imei: $imei, variant: $variant, color: $color, metadata: $metadata, buyBackPrice: $buyBackPrice, grade: $grade, price: $price, serial: $serial, storage: $storage) {
    id
  }
}
`

const ADD_TO_CART = `
mutation AddToCart($email: String, $variant: ID, $storage: ID, $color: ID, $device: ID) {
  addToCart(email: $email, variant: $variant, storage: $storage, color: $color, device: $device) {
    id
  }
}
`

const GET_USER = `

query GetUser($email: String) {
  getUser(email: $email) {
    isAdmin    
    email
    id
    shipping {
      building
      street
      suite
      town
    }
    phoneNumber
    phoneVerified
    verificationToken
    name
    image
    financingRequests {
      id 
      device {
        variant {
          id
          colors {
            images
            label
            id
          }
          model
          brand  
          storages {
            id
            label
            price
          }                  
        }
        color 
        storage
      }
      financer
      status
    }
    orders {
      variant {
        model
        colors {
          images
          id
          label
          primaryIndex
        }
        storages {
          label
          id
        }
      }
      color
      review {
        rating
        review
        image
        date
        id
      }
      saleInfo {
        payment {
          amount
          code
          mode
          timestamp
          financing
        }
        delivery {
          lat
          lng
          dispatchTime
          collectionTime
        }
        compliments
      }
      storage
      id
    }
    cart {
      id  
      storage
      color
      onOffer
      device {
        offer {
          price
        }
      }
      variant {
        colors {
          colorCode
          primaryIndex
          images
          label
          id
        }
        brand
        deviceType
        brand
        model
        financing
        id
        storages {
          id
          label
          price
        }
      }     
    }
    tradeIns {
      id
      offer
      variant {
        model
        brand
        deviceType
      }    
      storage
      createdAt
      payment {
        mode
        amount
        timestamp
        code    
      }   
      authorizationOk
      backCamOk
      batteryHealth
      chargingOk   
      earpieceOk
      frontCamOk
      mouthpieceOk
      screenCondition
      sideNBackCondition
      simTrayPresent
      speakerOk    
    }
    adminRights
  }
}
`

const REMOVE_FROM_CART = `
mutation RemoveFromCart($email: String, $removeFromCartId: ID) {
  removeFromCart(email: $email, id: $removeFromCartId) {
    id
  }
}
  `

const EDIT_SHIPPING = `
  mutation Mutation($editShippingId: ID, $building: String, $suite: String, $street: String, $town: String) {
    editShipping(id: $editShippingId, building: $building, suite: $suite, street: $street, town: $town) {
      shipping {
        building
        street
        suite
        town
      }
    }
  }
`

const GET_VARIANTS = `
query Query {
  getVariants {
    authCost
    backCamCost
    batteryCost
    bodyCost
    brand
    colors {
      id
      colorCode
      primaryIndex
      images
      label
    }
    deviceType
    earpieceCost
    financing
    frontCamCost
    id
    model
    motherBoardCost
    mouthpieceCost 
    screenCost
    simTrayCost
    speakerCost
    storages {
      id
      label
      price
    }
    technicalSpecifications {
      label
      value
    }
    tradeInAllowed
    featured
  }
}
`

const UPDATE_VARIANT = `
mutation UpdateVariant($updateVariantId: ID!, $tradeInAllowed: Boolean, $deviceType: String, $brand: String, $model: String, $technicalSpecifications: String, $screenCost: Int, $bodyCost: Int, $frontCamCost: Int, $backCamCost: Int, $earpieceCost: Int, $mouthpieceCost: Int, $speakerCost: Int, $authCost: Int, $simTrayCost: Int, $motherBoardCost: Int, $batteryCost: Int, $colors: String, $storages: String, $financing: [String] , $featured: Boolean) {
  updateVariant(id: $updateVariantId, tradeInAllowed: $tradeInAllowed, deviceType: $deviceType, brand: $brand, model: $model, technicalSpecifications: $technicalSpecifications, screenCost: $screenCost, bodyCost: $bodyCost, frontCamCost: $frontCamCost, backCamCost: $backCamCost, earpieceCost: $earpieceCost, mouthpieceCost: $mouthpieceCost, speakerCost: $speakerCost, authCost: $authCost, simTrayCost: $simTrayCost, motherBoardCost: $motherBoardCost, featured: $featured ,  batteryCost: $batteryCost, colors: $colors, storages: $storages, financing: $financing) {
    id
  }
}
`

const GET_DEVICES = `
query Query {
  getDevices {
    color{
      id
      label
    }    
    createdAt
    id    
    imei 
    variant {
      id
      brand
      model
      deviceType
    }  
    serialNo
    metadata {
      isRepaired
      repairDate
      purchaseDate
      sourceDefects
      sourceType
      sourceName
      repairCost
    }
    grade
    buyBackPrice
    storage {
      id
      label
    }
    offer {
      info {
        label
        start
        end
      }
      price
    }
  }
}
`

const ADD_BUYBACK = `
mutation Mutation($email: String, $model: String, $storage: String, $batteryHealth: Int, $frontCamOk: Boolean, $backCamOk: Boolean, $earpieceOk: Boolean, $mouthpieceOk: Boolean, $speakerOk: Boolean, $authorizationOk: Boolean, $simTrayPresent: Boolean, $chargingOk: Boolean, $screenCondition: String, $sideNBackCondition: String, $offer: Int) {
  createBuyBack(email: $email, model: $model, storage: $storage, batteryHealth: $batteryHealth, frontCamOk: $frontCamOk, backCamOk: $backCamOk, earpieceOk: $earpieceOk, mouthpieceOk: $mouthpieceOk, speakerOk: $speakerOk, authorizationOk: $authorizationOk, simTrayPresent: $simTrayPresent, chargingOk: $chargingOk, screenCondition: $screenCondition, sideNBackCondition: $sideNBackCondition, offer: $offer) {
    id
  }
}
`

const CANCEL_BUYBACK = `
mutation Mutation($updateBuyBackId: ID!, $cancel: Boolean) {
  updateBuyBack(id: $updateBuyBackId, cancel: $cancel) {
    id
  }
}
`

const CREATE_OFFER = `
mutation CreateOffer($label: String, $start: String, $end: String, $createdBy: String) {
  createOffer(label: $label, start: $start, end: $end, createdBy: $createdBy) {
    info {
      id
    }
  }
}
`

const GET_OFFERS = `
query Query {
  getOffers {
    devices {
      status
      variant {
        model
      }
      color {
        images
        label
      }
      imei
      storage {
        label
      }
      offer {
        price
      }
      serialNo
      id
    }
    info {
      start
      label
      id
      end
      createdBy {
        image
        name
      }
      createdAt
    }
  }
}
`
const GET_RUNNING_OFFERS = `
query Query {
  getRunningOffers {
    devices {
      status
      variant {
        model
      }
      color {
        images
        label
      }
      imei
      storage {
        label
        price
      }
      offer {
        price
      }
      serialNo
      id
    }
    info {
      start
      label
      id
      end
      createdBy {
        image
        name
      }
      createdAt
    }
  }
}
`

const RECORD_SALE = `
mutation RecordSale($paymentPhoneNumber: String, $saleVia: String, $paymentMode: String, $paymentTimestamp: String, $paymentCode: String, $customerId: String, $customerName: String, $customerPhonenumber: String, $customerEmail: String, $lat: String, $lng: String) {
  recordSale(paymentPhoneNumber: $paymentPhoneNumber, saleVia: $saleVia, paymentMode: $paymentMode, paymentTimestamp: $paymentTimestamp, paymentCode: $paymentCode, customerId: $customerId, customerName: $customerName, customerPhonenumber: $customerPhonenumber, customerEmail: $customerEmail, lat: $lat, lng: $lng) {
    id
  }
}
`

const UPDATE_PROFILE = `
mutation EditProfile($name: String, $phoneNumber: String, $editProfileId: ID) {
  editProfile(name: $name, phoneNumber: $phoneNumber, id: $editProfileId) {
    email
  }
}
`

// const GET_LANDING = `
// query Query {
//   getLanding {
//     bestSellers {
//       model
//       storages {
//         label
//         price
//       }
//       deviceType
//       colors {
//         colorCode
//         images
//         label
//       }
//       id
//     }
//     carousels {
//       smallScreen
//       link
//       largeScreen
//     }
//     runningOffers {
//       info {
//         label
//         start
//         end
//       }
//       devices {
//         status
//         variant {
//           model
//         }
//         color {
//           primaryIndex
//           images
//           label
//         }
//         storage {
//           label
//           price
//         }
//         offer {
//           price
//         }
//         id
//       }
//     }
//   }
// }
// `

const CREATE_VARIANT = `
mutation Mutation($tradeInAllowed: Boolean, $deviceType: String, $brand: String, $model: String, $technicalSpecifications: String, $screenCost: Int, $bodyCost: Int, $frontCamCost: Int, $backCamCost: Int, $earpieceCost: Int, $mouthpieceCost: Int, $speakerCost: Int, $authCost: Int, $simTrayCost: Int, $motherBoardCost: Int, $batteryCost: Int, $colors: String, $storages: String, $financing: [String]) {
  createVariant(tradeInAllowed: $tradeInAllowed, deviceType: $deviceType, brand: $brand, model: $model, technicalSpecifications: $technicalSpecifications, screenCost: $screenCost, bodyCost: $bodyCost, frontCamCost: $frontCamCost, backCamCost: $backCamCost, earpieceCost: $earpieceCost, mouthpieceCost: $mouthpieceCost, speakerCost: $speakerCost, authCost: $authCost, simTrayCost: $simTrayCost, motherBoardCost: $motherBoardCost, batteryCost: $batteryCost, colors: $colors, storages: $storages, financing: $financing) {
    id
  }
}
`

const REMOVE_VARIANT = `
  mutation RemoveVariant($removeVariantId: ID) {
  removeVariant(id: $removeVariantId) {
    removed
  }
}
`

const GET_REPAIRS = `
query GetRepairs {
  getRepairs {
    id
    variant
    dateBrought
    dateFixed
    defects
    device {
      serialNo
      imei
      variant {
        model
        brand
      }
      color{
        colorCode
        id
        label
      }
      metadata {
        sourceDefects
        repairDate
        isRepaired
      }
      storage {
        id
        label
      }
    }
    partsBought {
      cost
      part
    }
    repairType
    repairedBy
    serialNo
    serviceCost
    imei
  }
}
`

const UPDATE_REPAIR = `
mutation UpdateRepair($updateRepairId: ID, $partsBought: String, $serviceCost: Int, $repairedBy: String, $dateFixed: String) {
  updateRepair(id: $updateRepairId, partsBought: $partsBought, serviceCost: $serviceCost, repairedBy: $repairedBy, dateFixed: $dateFixed) {
    id
  }
}
`

const GET_TRADE_IN_REQUESTS = `
query Query {
  getBuyBacks {   
    cancelled
    color
    createdAt  
    id
    offer  
    payment {
      amount
      code
      mode
      timestamp
    }
    screenCondition    
    storage
    user {
      name
      phoneNumber
      email
    }
    variant {
      id
      brand
      model
      authCost
      backCamCost
      storages {
        label
        price
        id
      }
      colors {
        label
        id
      }   
      batteryCost
      bodyCost
      motherBoardCost
      mouthpieceCost
      removed
    
      screenCost
      simTrayCost
      frontCamCost
      speakerCost
      earpieceCost
    }
    createdAt
    authorizationOk
    backCamOk
    batteryHealth
    chargingOk
    earpieceOk
    frontCamOk
    mouthpieceOk
    sideNBackCondition
    simTrayPresent
    speakerOk
  }
}
`

const UPDATE_BUYBACK = `
mutation Mutation($screenCondition: String, $bodyCondition: String, $speakerReplaced: Boolean, $earpieceReplaced: Boolean, $cameraReplaced: Boolean, $bodyReplaced: Boolean, $batteryReplaced: Boolean, $functional: Boolean, $offer: Int, $id: ID, $color: String, $storage: String, $variant: ID, $status: String, $defects: [String], $imei: String, $serialNo: String, $grade: String) {
  updateBuyBack(screenCondition: $screenCondition, bodyCondition: $bodyCondition, speakerReplaced: $speakerReplaced, earpieceReplaced: $earpieceReplaced, cameraReplaced: $cameraReplaced, bodyReplaced: $bodyReplaced, batteryReplaced: $batteryReplaced, functional: $functional, offer: $offer, id: $id, color: $color, storage: $storage, variant: $variant, status: $status, defects: $defects, imei: $imei, serialNo: $serialNo, grade: $grade) {
 batteryReplaced
    bodyCondition
    bodyReplaced
    cameraReplaced
    cancelled
    color
    createdAt
    completedOn
    earpieceReplaced
    functional
    id
    offer
    status
    payment {
      amount
      code
      mode
      timestamp
    }
    screenCondition
    speakerReplaced
    storage
    user {
      name
      phoneNumber
      email
    }
    variant {
      id
      brand
      model
    }
    createdAt
  }
}
`

const SELL_DEVICE = `
mutation SellDevice($deviceId: ID, $sellDate: String, $customerName: String, $customerPhoneNumber: String, $customerId: ID, $compliments: [String], $sellPrice: Int, $financingOption: String, $txCodes: [String], $paymentMode: String) {
  sellDevice(sellDate: $sellDate ,deviceId: $deviceId, customerName: $customerName, customerPhoneNumber: $customerPhoneNumber, customerId: $customerId, compliments: $compliments, sellPrice: $sellPrice, financingOption: $financingOption, txCodes: $txCodes, paymentMode: $paymentMode) {
    id
  }
}

`

const GET_CUSTOMERS = `
query GetCustomers {
  getCustomers {
    isAdmin
    phoneNumber
    name
    email
    id
  }
}
`

const GET_SALES = `
query GetSales {
  getSales {
    color
    customerName
    customerPhoneNumber
    financer
    imei
    margin
    purchasePrice
    recordedBy {
      name
    }
    repairCost
    saleDate
    salePrice
    saleVia
    serialNo
    storage
    variant
  }
}`

const TOGGLE_VISIBILITY = `
mutation ToggleVisibility($compliments: [String] , $toggleVisibilityId: ID, $images: [String], $price: Int, $description: String) {
  toggleVisibility(compliments: $compliments, id: $toggleVisibilityId, images: $images, price: $price, description: $description) {
    id
  }
}
`

const CREATE_FINANCING_REQUEST = `
mutation CreateFinancingRequest($customer: String, $cart: String, $financer: String) {
  createFinancingRequest(customer: $customer, cart: $cart, financer: $financer) {
    id
  }
}
`

const GET_FINANCE_REQUESTS = `
query GetAllFinancingRequests {
  getAllFinancingRequests {
    id
    customer {
      name
      email
      phoneNumber
      shipping {
        town
      }
    }
    date
    device {
      color
      storage
      variant {
        model
        storages {
          label
          id
          price
        }
        colors {
          label
          id
        }
      }
    }
    financer
    status
  }
}
`

const GET_ALL_ORDERS = `
query Query {
  getAllOrders {
    id 
    saleInfo {
      customer {
        email
        name
        phoneNumber
        shipping {
          town
          street
        }
      }
      saleVia
      payment {
        phoneNumber
        amount
        codes
        financing
        mode
        timestamp
      }
      delivery {
        collectionTime
        dispatchTime
        lat
        lng
      }
      compliments
    }
    color   
    storage
    variant {
      id
      brand
      model
      deviceType
      storages {
        id
        label
      }
      colors {
        id
        label
      }
    }
    device {
      id
      imei
      status
      offer {
        info {
          label
        }        
      }
    }
  }
}
`

const DISPATCH_ORDER = `
mutation DispatchOrder($deviceId: ID, $orderId: ID) {
  dispatchOrder(deviceId: $deviceId, orderId: $orderId) {
    id
  }
}
`

const COLLECT_ORDER = `
mutation CollectOrder($orderId: ID) {
  collectOrder(orderId: $orderId) {
    id
  }
}
`

const GET_ADMINS = `
query GetAdmins {
  getAdmins {
    id
    adminRights 
    name
    email
    phoneNumber
    adminSince
    rulesSetBy {
      name
    }
  }
}
`

const EDIT_RIGHTS = `
mutation EditRights($rights: [String], $editRightsId: String, $changedBy: String) {
  editRights(rights: $rights, id: $editRightsId, changedBy: $changedBy) {
    adminRights
  }
}
`

const REMOVE_ADMIN = `
  mutation RemoveAdmin($removeAdminId: ID) {
  removeAdmin(id: $removeAdminId) {
    adminRights
  }
}
`

const GET_SUGGESTIONS = `
query GetSuggestions($brand: String) {
  getSuggestions(brand: $brand) {
    colors {
      colorCode
      images
      label
      id
      primaryIndex
    }
    brand
    deviceType
    financing
    model
    storages {
      id
      label
      price
    }
    technicalSpecifications {
      label
      value
    }
    id
  }
}
`

const GET_CAROUSELS = `
query GetCarousels {
  getCarousels {
    createdAt
    createdBy {
      name
      image
    }
    id
    smallScreen
    largeScreen
    link    
  }
}
`

const CREATE_CAROUSEL = `
mutation CreateCarousel($smallScreen: String, $largeScreen: String, $link: String, $createdBy: String) {
  createCarousel(smallScreen: $smallScreen, largeScreen: $largeScreen, link: $link, createdBy: $createdBy) {
    id
  }
}
`
const REMOVE_CAROUSEL = `
    mutation RemoveCarousel($removeCarouselId: ID) {
    removeCarousel(id: $removeCarouselId) {
      id
    }
  }
`

const COMPLETE_BUYBACK = `
  mutation CompleteBuyback($completeBuybackId: ID, $variant: ID, $color: String, $storage: String, $batteryHealth: Int, $frontCamOk: Boolean, $backCamOk: Boolean, $earpieceOk: Boolean, $mouthpieceOk: Boolean, $speakerOk: Boolean, $authorizationOk: Boolean, $simTrayPresent: Boolean, $chargingOk: Boolean, $screenCondition: String, $offer: Int, $sideNBackCondition: String, $defects: [String], $imei: String, $serialNo: String, $grade: String, $customerName: String, $customerPhone: String) {
  completeBuyback(id: $completeBuybackId, variant: $variant, color: $color, storage: $storage, batteryHealth: $batteryHealth, frontCamOk: $frontCamOk, backCamOk: $backCamOk, earpieceOk: $earpieceOk, mouthpieceOk: $mouthpieceOk, speakerOk: $speakerOk, authorizationOk: $authorizationOk, simTrayPresent: $simTrayPresent, chargingOk: $chargingOk, screenCondition: $screenCondition, offer: $offer, sideNBackCondition: $sideNBackCondition, defects: $defects, imei: $imei, serialNo: $serialNo, grade: $grade, customerName: $customerName, customerPhone: $customerPhone) {
    id
  }
}
`

const SET_DEVICE_ON_OFFER = `
mutation SetDeviceonOffer($offerId: ID, $deviceId: ID, $price: Int) {
  setDeviceonOffer(offerId: $offerId, deviceId: $deviceId, price: $price) {
    id
  }
}
`

const REMOVE_FROM_OFFER = `
mutation RemoveFromOffer($removeFromOfferId: ID) {
  removeFromOffer(id: $removeFromOfferId) {
    id
  }
}
`

const GET_SALE_STATS = `
query Query {
  getSalesStatistics {
    weeklySales {
      sales
      date
    }
      monthlySales{
        sales
        month
      }
      saleByType {
        value
        name
        color
      }
      financingRequests {
        value
        name
        color
      }
      saleByBrand{
        brand
        sales
      }
        saleByModel {
          model
          sales
        }
  }
}
  `

const SEND_VERIFICATION_TOKEN = `
  mutation Mutation($sendVerificationTokenId: ID) {
  sendVerificationToken(id: $sendVerificationTokenId)
}
`

const COMPLETE_VERIFICATION = `
 mutation CompleteVerification($completeVerificationId: ID, $otp: String) {
  completeVerification(id: $completeVerificationId, otp: $otp) {
    phoneVerified
  }
}
`

const CANCEL_FINANCING_REQUEST = `
mutation CancelFinancingRequest($request: ID) {
  cancelFinancingRequest(request: $request) {
    status
  }
}
`

const APPROVE_FINANCING_REQUEST = `
mutation ApproveFinancingRequest($request: ID, $txCodes: [String], $paymentMode: String, $amount: Int) {
  approveFinancingRequest(request: $request, txCodes: $txCodes, paymentMode: $paymentMode, amount: $amount) {
    id
  }
}
`

const CREATE_REPAIR = `
mutation CreateRepair($repairType: String, $dateBrought: String, $imei: String, $variant: String, $serialNo: String, $customerName: String, $customerPhoneNumber: String, $defects: [String]) {
  createRepair(repairType: $repairType, dateBrought: $dateBrought, imei: $imei, variant: $variant, serialNo: $serialNo, customerName: $customerName, customerPhoneNumber: $customerPhoneNumber, defects: $defects) {
    id
  }
}
`

const GET_VARIANT = `
query GetVariant($getVariantId: ID) {
  getVariant(id: $getVariantId) {
    colors {
      availableStorages
      colorCode
      images
      label
      id
    }
    brand
    deviceType
    financing
    model
    storages {
      availableColors
      id
      label
      price
    }
    technicalSpecifications {
      label
      value
    }
    reviews{
      id
      rating
      review
      image
      date
      customer {
        name
        image
      }        
    }
  }
}
`

const GET_AVAILABLE_DEVICES_IMEI = `
  query GetAvailableDevices($variant: ID, $storage: ID, $color: ID) {
  getAvailableDevices(variant: $variant, storage: $storage, color: $color) {
    imei
    id
    metadata {
      isRepaired
    }
  }
}
`

const EDIT_DEVICE = `
mutation Mutation($editDeviceId: ID, $imei: String, $variant: ID, $storage: ID, $color: ID, $metadata: String, $serial: String, $buyBackPrice: Int, $grade: String) {
  editDevice(id: $editDeviceId, imei: $imei, variant: $variant, storage: $storage, color: $color, metadata: $metadata, serial: $serial, buyBackPrice: $buyBackPrice, grade: $grade) {
    id
  }
}
`

const ADD_ADMIN = `
mutation AddAdmin($addAdminId: ID) {
  addAdmin(id: $addAdminId) {
    id
  }
}
`

const ADD_MAILING = `
mutation AddMailing($email: String) {
  addMailing(email: $email) {
    email
    id
  }
}
`

const SAVE_REVIEW = `
mutation SaveReview($review: String, $rating: Int, $image: String, $orderId: ID) {
  saveReview(review: $review, rating: $rating, image: $image, orderId: $orderId) {
    id
  }
}
`

const GET_REVIEWS = `
query GetReviews {
  getReviews {
    customer {
      image
      name
    }
    date
    featured
    id
    image
    product {
      colors {
        images
      }
        model
    }
    rating
    review
  }
}
`

const UPDATE_REVIEW = `
mutation UpdateReview($reviewId: ID, $featured: Boolean, $removed: Boolean) {
  updateReview(reviewId: $reviewId, featured: $featured, removed: $removed) {
    id
  }
}
`

const GET_FEATURED_REVIEWS = `
  query GetReviews {
  getFeaturedReviews {
    customer {
      image
      name
    }
    date
    featured
    id
    image
    product {
      id
      colors {
        images
      }
        model
    }
    rating
    review
  }
}
`

const GET_TECH_TIPS = `
  query CreatedBy {
  getTechTips {
    link
    id
  }
}
`

const ADD_TECH_TIP = `
  mutation AddTechTip($link: String, $createdBy: String) {
  addTechTip(link: $link, createdBy: $createdBy) {
    id
  }
}
`

const REMOVE_TECH_TIP = `
  mutation DeleteTechTip($deleteTechTipId: String) {
  deleteTechTip(id: $deleteTechTipId) {
    id
    link
  }
}
`

const GET_BLOG = `
query GetBlog($getBlogId: ID) {
  getBlog(id: $getBlogId) {
    category
    content
    createdBy {
      name
      image
    }
    id
    thumbnail
    title
  }
}
`

const GET_BLOGS = `
query GetBlogs {
  getBlogs {
    category
    id
    thumbnail
    title
    content
    createdBy {
      name
      id
      image
    }
  }
}
`

const ADD_BLOG = `
  mutation AddBlog($content: String, $createdBy: ID, $title: String, $thumbnail: String, $category: String) {
  addBlog(content: $content, createdBy: $createdBy, title: $title, thumbnail: $thumbnail, category: $category) {
    id
  }
}
`

const DELETE_BLOG = `
  mutation RemoveBlog($removeBlogId: ID) {
  removeBlog(id: $removeBlogId) {
    id
  }
}
`

const UPDATE_BLOG = `
  mutation UpdateBlog($updateBlogId: ID, $content: String, $title: String, $thumbnail: String, $category: String) {
  updateBlog(id: $updateBlogId, content: $content, title: $title, thumbnail: $thumbnail, category: $category) {
    id
  }
}
`

const GET_FEATURED = `
query GET_FEATURED {
  getFeatured {
    brand
    colors {
      availableStorages
      colorCode
      id
      images
      label
      primaryIndex
    }
    deviceType
    id
    model
    storages {
      price
      label
      id
      availableColors
    }
  }
}
`

const SEARCH_VARIANTS = `
 query SearchVariants($q: String, $brand: [String], $model: [String], $deviceType: [String]) {
      searchVariants(q: $q, brand: $brand, model: $model, deviceType: $deviceType) {
        brand
        model
        deviceType
      }
    }
`

export {
  SEARCH_VARIANTS,
  GET_RUNNING_OFFERS,
  GET_FEATURED,
  UPDATE_BLOG,
  GET_BLOG,
  GET_BLOGS,
  ADD_BLOG,
  DELETE_BLOG,
  REMOVE_TECH_TIP,
  ADD_TECH_TIP,
  GET_TECH_TIPS,
  GET_FEATURED_REVIEWS,
  UPDATE_REVIEW,
  GET_REVIEWS,
  SAVE_REVIEW,
  ADD_MAILING,
  ADD_ADMIN,
  EDIT_DEVICE,
  GET_AVAILABLE_DEVICES_IMEI,
  GET_VARIANT,
  CREATE_REPAIR,
  APPROVE_FINANCING_REQUEST,
  CANCEL_FINANCING_REQUEST,
  UPDATE_VARIANT,
  COMPLETE_VERIFICATION,
  SEND_VERIFICATION_TOKEN,
  GET_SALE_STATS,
  REMOVE_FROM_OFFER,
  SET_DEVICE_ON_OFFER,
  REMOVE_CAROUSEL,
  CREATE_CAROUSEL,
  GET_CAROUSELS,
  REMOVE_ADMIN,
  EDIT_RIGHTS,
  GET_ADMINS,
  COLLECT_ORDER,
  DISPATCH_ORDER,
  GET_ALL_ORDERS,
  CREATE_FINANCING_REQUEST,
  GET_SUGGESTIONS,
  GET_DEVICE,
  CREATE_DEVICE,
  ADD_TO_CART,
  GET_USER,
  REMOVE_FROM_CART,
  EDIT_SHIPPING,
  GET_VARIANTS,
  GET_DEVICES,
  ADD_BUYBACK,
  CANCEL_BUYBACK,
  CREATE_OFFER,
  GET_OFFERS,
  RECORD_SALE,
  UPDATE_PROFILE,
  CREATE_VARIANT,
  REMOVE_VARIANT,
  GET_REPAIRS,
  UPDATE_REPAIR,
  UPDATE_BUYBACK,
  GET_TRADE_IN_REQUESTS,
  SELL_DEVICE,
  GET_CUSTOMERS,
  GET_SALES,
  TOGGLE_VISIBILITY,
  GET_FINANCE_REQUESTS,
  COMPLETE_BUYBACK,
}
