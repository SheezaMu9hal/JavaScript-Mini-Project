// firebaseFunctions.js

// Your web app's Firebase configuration

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAN2Nx7FHSmN4xPZ5PvPEtQdLY5kqvnbVM",
  authDomain: "saylani-online-shopping.firebaseapp.com",
  databaseURL: "https://saylani-online-shopping-default-rtdb.firebaseio.com",
  projectId: "saylani-online-shopping",
  storageBucket: "saylani-online-shopping.appspot.com",
  messagingSenderId: "976589070541",
  appId: "1:976589070541:web:1bef6a822e705fc6d00984",
  measurementId: "G-5KJVHQHXQQ"
};


// Initialize Firebase
var app = firebase.initializeApp(firebaseConfig);

var auth = firebase.auth();

  
  function signOut() {
  firebase.auth().signOut()
  .then(() => {
    sessionStorage.removeItem('email');
    console.log("User logout successfully")
    // Sign-out successful.
  }).catch((error) => {
    // An error happened.
    console.log(error);
  });
}

const database = firebase.database();



// Function to sign up sellers
function signupSeller() {
  var email = document.getElementById('inputEmail').value;
  var password = document.getElementById('inputPassword').value;
  var name = document.getElementById('inputName').value;
  
  firebase.auth().createUserWithEmailAndPassword(email, password)
  .then(function (userCredential) {
    var user = userCredential.user;
    writeSellerData(user.uid, name, email);
    console.log(user);
    sessionStorage.setItem('email', user.email);
    window.location.href = '../SellerPanel.html';
  })
  .catch(function (error) {
    var errorCode = error.code;
    var errorMessage = error.message;
    // Handle errors
    console.error(errorMessage);
  });
}

function writeSellerData(sellerId, name, email) {
  firebase.database().ref('sellers/' + sellerId).set({
    name: name,
    email: email,
  })
  .then(() => {
    console.log('Seller data written successfully.');
    window.location.href = '../SellerData.html';
  })
  .catch((error) => {
    console.error('Error writing seller data:', error);
  });
}

function submitForm() {
  var storeType = document.getElementById('storeType').value;
  var brandName = document.getElementById(`${storeType}BrandName`).value;
  var brandSlogan = document.getElementById(`${storeType}BrandSlogan`).value;
  var brandDescription = document.getElementById(`${storeType}BrandDescription`).value;
  var brandLogoFile = document.getElementById(`${storeType}BrandLogo`).files[0];
  var brandMainImageFile = document.getElementById(`${storeType}BrandMainImage`).files[0];
  var currentUser = firebase.auth().currentUser;
  
  if (!currentUser) {
    console.error("No user is currently signed in.");
    return;
  }
  
  var userData = {
    name: currentUser.displayName,
    email: currentUser.email,
    uid: currentUser.uid
  };
  
  var brandData = {
    name: brandName,
    slogan: brandSlogan,
    description: brandDescription,
    owner: userData
  };
  
  var brandLogoRef = firebase.storage().ref().child(`${storeType}/brand/${brandName}/logo/${brandLogoFile.name}`);
  var brandMainImageRef = firebase.storage().ref().child(`${storeType}/brand/${brandName}/mainImage/${brandMainImageFile.name}`);
  
  var uploadLogoTask = brandLogoRef.put(brandLogoFile).then(snapshot => {
    return snapshot.ref.getDownloadURL();
  });
  
  var uploadMainImageTask = brandMainImageRef.put(brandMainImageFile).then(snapshot => {
    return snapshot.ref.getDownloadURL();
  });

  Promise.all([uploadLogoTask, uploadMainImageTask]).then(results => {
    brandData.logoURL = results[0];
    brandData.mainImageURL = results[1];
    
    var collections = [];
    var collectionsContainer = document.getElementById('collectionsContainer').children;
    
    for (var i = 0; i < collectionsContainer.length; i++) {
      var collectionName = collectionsContainer[i].querySelector(`#collectionName${i + 1}`).value;
      var products = [];
      var productsContainer = collectionsContainer[i].querySelectorAll(`#products${i + 1} .product`);
      
      for (var j = 0; j < productsContainer.length; j++) {
      var productName = productsContainer[j].querySelector(`#productName${i + 1}-${j + 1}`).value;
      var productPrice = productsContainer[j].querySelector(`#productPrice${i + 1}-${j + 1}`).value;
      var productImageFile = productsContainer[j].querySelector(`#productImage${i + 1}-${j + 1}`).files[0];
      var productImageRef = firebase.storage().ref().child(`${storeType}/brand/${brandName}/${collectionName}/${productName}/${productImageFile.name}`);
      
      var uploadProductImageTask = productImageRef.put(productImageFile).then(snapshot => {
        return snapshot.ref.getDownloadURL();
      });

      products.push({
        name: productName,
        price: productPrice,
        imageURL: uploadProductImageTask 
      });
    }
    collections.push({
      name: collectionName,
      products: products
    });
  }
  
  Promise.all(collections.map(collection => 
    Promise.all(collection.products.map(product =>
      product.imageURL.then(url => ({ ...product, imageURL: url })) // Resolve imageURL promise
      ))
      )).then(updatedCollections => {
    brandData.collections = updatedCollections;
    
    var userId = userData.uid;
    
    var updates = {};
    updates[`sellers/${userId}/${storeType}/${brandName}`] = brandData;
    
    firebase.database().ref().update(updates).then(() => {
      console.log(`Brand ${brandName} saved successfully`);
      alert('Form submitted successfully!');
      window.location.href = '../SellerData.html';
    }).catch(error => {
      console.error(`Error saving brand ${brandName}:`, error);
      alert('Error submitting form. Please try again.');
    });
  }).catch(error => {
    console.error("Error uploading product images:", error);
    alert('Error uploading product images. Please try again.');
  });
}).catch(error => {
  console.error("Error uploading brand images:", error);
  alert('Error uploading brand images. Please try again.');
});
}


function signInSeller() {
  var email = document.getElementById('inputEmail').value;
  var password = document.getElementById('inputPassword').value;

  auth.signInWithEmailAndPassword(email, password)
    .then((userCredential) => {
      const user = userCredential.user;
      console.log("Sign-in successful for user:", user.uid);
      window.location.href = '../SellerData.html';

    })
    .catch((error) => {
      // Sign-in failed
      console.error("Error signing in:", error.message);
    });
}

function fetchStoreData() {
  const user = firebase.auth().currentUser;

  if (user) {
      const userUID = user.uid;

      const userRef = firebase.database().ref('sellers').child(userUID);
      userRef.once('value', function (snapshot) {
          const storeData = snapshot.val();

          console.log("Fetched store data:", storeData);

          let storeType = Object.keys(storeData)[0]; 
          if(storeType === "email"){
            storeType = Object.keys(storeData)[1];
            if(storeType === "name"){
              storeType = Object.keys(storeData)[2];
            }
          }
          const brandName = Object.keys(storeData[storeType])[0]; 
          console.log(brandName,storeType);
          displayStoreDetails(storeData, storeType, brandName);
      });
  } else {
      console.log("No user is signed in.");
  }
}

firebase.auth().onAuthStateChanged(function (user) {
  if (user) {
      fetchStoreData();
  } else {
      console.log("No user is signed in.");
  }
});



// Function to sign up users
  function signupUser() {
    var email = document.getElementById('inputEmail').value;
    var password = document.getElementById('inputPassword').value;
    var name = document.getElementById('inputName').value;
    
    firebase.auth().createUserWithEmailAndPassword(email, password)
    .then(function (userCredential) {
      var user = userCredential.user;
      writeUserData(user.uid, name, email);
      console.log(user);
      sessionStorage.setItem('email', user.email);
      window.location.href = '../UserPanel.html';
    })
    .catch(function (error) {
      var errorCode = error.code;
      var errorMessage = error.message;
      console.error(errorMessage);
    });
  }
  // Function to write user data to the database
      function writeUserData(userId, name, email) {
        firebase.database().ref('users/' + userId).set({
          name: name,
          email: email,
        })
        .then(() => {
          console.log('User data written successfully.');
        })
        .catch((error) => {
            console.error('Error writing user data:', error);
          });
        }
        
        
        // Function to sign in users
        function signInUser() {
          var email = document.getElementById('inputEmail').value;
          var password = document.getElementById('inputPassword').value;
          
          auth.signInWithEmailAndPassword(email, password)
          .then((userCredential) => {
            const user = userCredential.user;
            console.log("Signed in user: ", user);
            sessionStorage.setItem('email', user.email);
            window.location.href = '../UserPanel.html';
          })
          .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            console.log("Error: ", errorMessage);
          });
        }