import http from "http";

const reqData = JSON.stringify({
  name: "Debug Test",
  email: "debugtest@example.com",
  password: "Password@123",
  phone: "0987654321",
  role: "customer"
});

const req = http.request({
  hostname: "localhost",
  port: 5000,
  path: "/api/auth/register",
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Content-Length": reqData.length
  }
}, (res) => {
  let data = "";
  res.on("data", chunk => data += chunk);
  res.on("end", () => {
    console.log("Response:", res.statusCode, data);
  });
});

req.on("error", error => console.error(error));
req.write(reqData);
req.end();
