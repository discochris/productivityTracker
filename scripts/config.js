require('dotenv').config(); // if using dotenv
const config = {
  token: process.env.GITHUB_TOKEN,
  repos: [
    "wbd-streaming/gqa-automation",
    "wbd-streaming/stb-tester-test-pack-hbo"
  ],
  teamMembers: [
    // "naveen-negi088",
    // "jugal-patel1",
    // "raju-bhupathiraju",
    // "kmistry2103",
    // "busireddynaveen",
    // "animesh445",
    "mudebalaji-wbd",
    // "ravishobhit",
    // "balaganesh3093",
    // "ManyamDinesh",
    "PooranSinghwbd"
  ],
  startDate: "2025-04-04T00:00:00Z",
  endDate: "2025-04-25T23:59:00Z"
};
module.exports = { config };