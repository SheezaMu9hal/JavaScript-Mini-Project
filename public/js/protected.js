const email = sessionStorage.getItem('email');
console.log(email)

if (!email) {
    window.location.href = '../SellerData.html'
}
if (email) {
    const signIn = document.getElementById('signin');
    signIn.innerText = 'Logout';
}

