import { setUserToken } from "../datastore/userDataStore";
import { emitter } from "../service/event";

export default function signin() {
  //const token = localStorage.getItem("data-user-token");
  const token =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjExLCJ1c2VyTmFtZSI6IuW-s-WztuWkqumDjiIsInNldHRpbmciOnsiaXNEZWxldGVNb2RhbFNob3ciOjF9LCJpYXQiOjE2NTQ5NTg4ODZ9.3QRqu_-DMA-nlhKvx39-ihsacMb0mKVhXMO5j0nE4no";
  if (token != null) {
    setTimeout(() => {
      console.log("token exists local storage");
      setUserToken(token);
      emitter.emit("signin-ok");
    }, 200);
    return;
  } else {
    window.location.href = "http://localhost:3030/signin";
    return
  }
}