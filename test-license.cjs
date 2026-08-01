const {
  createLicenseCode,
} = require(
  "./transport-backend/services/licenseGenerator.js"
);

try {
  const result =
    createLicenseCode({
      customerId: "CUS-001",
      customerName: "Test Customer",

      projectId: "ISP-001",
      projectName: "ISP System",

      deviceId:
        "TEST-DEVICE-1234",

      licenseType: "custom",

      startDate: "2026-07-30",
      endDate: "2026-08-30",

      features: ["all"],
    });

  console.log(
    "\nLicense created successfully:\n"
  );

  console.log(
    result.licenseCode
  );

  console.log(
    "\nLicense information:\n"
  );

  console.log(
    result.certificate.payload
  );
} catch (error) {
  console.error(
    "License generation failed:"
  );

  console.error(
    error.message
  );
}
