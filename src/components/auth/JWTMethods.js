// import { SignJWT, decodeJwt, jwtVerify } from 'jose';

// // const userData = {
// //   "id": 3,
// //   "role": "admin",
// //   "username": "Admin-VP"
// // };

// export const generateUserToken = async (userData) => {

//   const encoder = new TextEncoder();

//   const secretKey = userData.username;

//   const expirationTime = Math.floor(Date.now() / 1000) + 1800;

//   const token = await new SignJWT(userData)
//     .setProtectedHeader({ alg: 'HS256' })
//     .setExpirationTime(expirationTime)
//     .sign(encoder.encode(secretKey));

//   localStorage.setItem("userToken", token);
// };

// export const decodeUserToken = () => {
//   try {
//     const token = localStorage.getItem("userToken");
//     const decoded = decodeJwt(token);
//     // console.log('Decoded JWT:', decoded);
//     const { id, role, username } = decoded;
//     return { id, role, username };
//   } catch (error) {
//     // console.error('Error decoding JWT:', error);
//     return null;
//   }
// };

// export const verifyUserToken = async () => {
//   try {
//     const token = localStorage.getItem("userToken");
    
//     const { username: secretKey } = decodeUserToken();
//     const encoder = new TextEncoder();
//     const { payload } = await jwtVerify(token, encoder.encode(secretKey));
//     // console.log('Verified JWT:', payload);
//     return payload;
//   } catch (error) {
//     // console.error('Invalid or expired JWT:', error.message);
//     return null;
//   }
// };
