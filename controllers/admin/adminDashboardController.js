const adminModel = require("../../models/adminModel");
const catchAsync = require("../../utils/catchAsync");
const bcrypt = require("bcryptjs");
const AppError = require("../../utils/appError");

const ViewsModel = require("../../models/viewsModel");
const ContentModel = require("../../models/contentModel");
const {
    generateDate,
  } = require("../../utils/helper");

// admin dashboard analytics
exports.analytics = catchAsync(async (req, res, next) => {

    let {duration,type} = req.query

    const { status: isValidDuration, firstDay, lastDay } = generateDate(duration);
    if (!isValidDuration) {
      return next(new AppError("Invalid Duration", 500));
    }

    let filter = {
        createdAt: {$gte:firstDay,$lt:lastDay},
        type:type
    };
  

    let views = await ViewsModel.find(filter);

    let result = {}
  if (duration === "week" || duration === "wholeWeek") {
    result.byWeek = groupByWeek(views);
  } else if (duration === "month" || duration === "months") {
    result.byMonth = groupByMonth(views);
  } else if (duration === "year") {
    result.byYear = groupByYear(views);
  }

    return res.status(200).json({
      status: true,
      message:"total views",
      result:result,
    });
});

// // Helper function to group views by week
// const groupByWeek = (views, firstDay, lastDay) => {
//   let byWeek = {};

//   // Get the starting and ending day of the week
//   let currDay = new Date(firstDay);
//   let endDay = new Date(lastDay);
//   endDay.setDate(endDay.getDate() + 1); // Increment by 1 to include the last day in the week

//   // Iterate over each day within the week
//   while (currDay < endDay) {
//     let dateStr = currDay.toISOString().split("T")[0];
//     byWeek[dateStr] = 0;
//     currDay.setDate(currDay.getDate() + 1);
//   }

//   // views.forEach((view) => {
//   //   // Check if the createdAt is within the week
//   //   if (view.createdAt >= firstDay && view.createdAt < endDay) {
//   //     let dateStr = view.createdAt.toISOString().split("T")[0];
//   //     byWeek[dateStr].push(view);
//   //   }
//   // });

//   views.forEach((view) => {
//     // Check if the createdAt is within the week
//     if (view.createdAt >= firstDay && view.createdAt < endDay) {
//       let dateStr = view.createdAt.toISOString().split("T")[0];
//       byWeek[dateStr] += 1; // Increment the count for the corresponding day
//     }
//   });

//   return byWeek;
// };

const groupByWeek = (views) => {
  const byWeek = {};

  // Get the current date and time
  const currentDate = new Date();

  // Calculate the first and last day of the last complete week (Monday to Sunday)
  const lastDay = currentDate.getDay() === 0 ? 7 : currentDate.getDay();
  const endDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - (lastDay % 7));
  const firstDay = new Date(endDay.getFullYear(), endDay.getMonth(), endDay.getDate() - 6);

  // Iterate over each day within the week
  let currDay = new Date(firstDay.getTime());
  while (currDay <= endDay) {
    let dateStr = currDay.toISOString().split("T")[0];
    byWeek[dateStr] = 0;
    currDay.setDate(currDay.getDate() + 1);
  }

  // Iterate over the views
  views.forEach((view) => {
    // Check if the createdAt is within the week
    if (view.createdAt >= firstDay && view.createdAt <= endDay) {
      let dateStr = view.createdAt.toISOString().split("T")[0];

      // Increment the count for the corresponding day
      byWeek[dateStr] += 1;
    }
  });

  return byWeek;
};


// const groupByWeek = (views, duration) => {
//   const byWeek = {};

//   // Get the current date and time
//   const currentDate = new Date();

//   // Calculate the first and last day of the last complete week (Monday to Sunday)
//   const lastDay = currentDate.getDay() === 0 ? 7 : currentDate.getDay();
//   const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - (lastDay + 6) % 7);
//   const endDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - (lastDay % 7));

//   // Iterate over each day within the week
//   let currDay = new Date(firstDay.getTime());
//   while (currDay <= endDay) {
//     let dateStr = currDay.toISOString().split("T")[0];
//     byWeek[dateStr] = 0;
//     currDay.setDate(currDay.getDate() + 1);
//   }

//   // Iterate over the views
//   views.forEach((view) => {
//     // Check if the createdAt is within the week
//     if (view.createdAt >= firstDay && view.createdAt <= endDay) {
//       let dateStr = view.createdAt.toISOString().split("T")[0];

//       // Increment the count for the corresponding day
//       byWeek[dateStr] += 1;
//     }
//   });

//   return byWeek;
// };

const groupByMonth = (views) => {
  const byMonth = {};

  // Get the current date and time
  const currentDate = new Date();

  // Calculate the first and last day of the last complete month
  const lastMonth = currentDate.getMonth();
  const lastMonthFirstDay = new Date(currentDate.getFullYear(), lastMonth - 1, 1);
  const lastMonthLastDay = new Date(currentDate.getFullYear(), lastMonth, 0);

  // Split the last complete month data into weeks
  const weeks = splitIntoWeeks(lastMonthFirstDay, lastMonthLastDay);

  // Initialize the week-based data structure
  weeks.forEach((week) => {
    byMonth[week] = 0;
  });

  // Iterate over the views
  views.forEach((view) => {
    // Check if the createdAt is within the last complete month
    if (view.createdAt >= lastMonthFirstDay && view.createdAt <= lastMonthLastDay) {
      const weekIndex = getWeekIndex(view.createdAt, weeks);

      // Increment the count for the corresponding week
      if (weekIndex !== -1) {
        byMonth[weeks[weekIndex]] += 1;
      }
    }
  });

  return byMonth;
};

// Helper function to split a given month into weeks
const splitIntoWeeks = (firstDay, lastDay) => {
  const weeks = [];

  let currDay = new Date(firstDay.getTime());
  while (currDay <= lastDay) {
    weeks.push(currDay.toISOString().split("T")[0]);
    currDay.setDate(currDay.getDate() + 7);
  }

  return weeks;
};

// Helper function to get the index of the week for a given date
const getWeekIndex = (date, weeks) => {
  const dateStr = date.toISOString().split("T")[0];

  return weeks.findIndex((week) => dateStr >= week);
};



// const groupByMonth = (views, firstDay, lastDay) => {
//   // Initialize the result object
//   const byMonth = {};

//   // Iterate over the views
//   views.forEach((view) => {
//     // Check if the createdAt is within the month
//     if (view.createdAt >= firstDay && view.createdAt < lastDay) {
//       // Calculate the week number for the view's createdAt
//       const weekNumber = getWeekNumber(view.createdAt);

//       // Check if the week number exists in the byMonth object
//       if (!byMonth[weekNumber]) {
//         // If not, initialize it with a count of 1
//         byMonth[weekNumber] = 1;
//       } else {
//         // If it exists, increment the count by 1
//         byMonth[weekNumber] += 1;
//       }
//     }
//   });

//   return byMonth;
// };

// // Helper function to get the week number of a date
// const getWeekNumber = (date) => {
//   const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
//   const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
//   return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
// };

// const groupByYear = (views, firstDay, lastDay) => {
//   // Initialize the result object
//   const byYear = {};

//   // Iterate over the views
//   views.forEach((view) => {
//     // Check if the createdAt is within the year
//     if (view.createdAt >= firstDay && view.createdAt < lastDay) {
//       // Get the month and year of the view's createdAt
//       const month = view.createdAt.getMonth();
//       const year = view.createdAt.getFullYear();

//       // Generate a unique key for the month and year combination
//       const key = `${year}-${month}`;

//       // Check if the key exists in the byYear object
//       if (!byYear[key]) {
//         // If not, initialize it with a count of 1
//         byYear[key] = 1;
//       } else {
//         // If it exists, increment the count by 1
//         byYear[key] += 1;
//       }
//     }
//   });

//   return byYear;
// };

const groupByYear = (views) => {
  const byYear = {};

  // Get the current date and time
  const currentDate = new Date();

  // Calculate the first and last day of the last complete year
  const lastYear = currentDate.getFullYear() - 1;
  const lastYearFirstDay = new Date(lastYear, 0, 1);
  const lastYearLastDay = new Date(lastYear, 11, 31);

  // Split the last complete year data into months
  const months = splitIntoMonths(lastYearFirstDay, lastYearLastDay);

  // Initialize the month-based data structure
  months.forEach((month) => {
    byYear[month] = 0;
  });

  // Iterate over the views
  views.forEach((view) => {
    // Check if the createdAt is within the last complete year
    if (view.createdAt >= lastYearFirstDay && view.createdAt <= lastYearLastDay) {
      const monthIndex = getMonthIndex(view.createdAt, months);

      // Increment the count for the corresponding month
      if (monthIndex !== -1) {
        byYear[months[monthIndex]] += 1;
      }
    }
  });

  return byYear;
};

// Helper function to split a given year into months
const splitIntoMonths = (firstDay, lastDay) => {
  const months = [];

  let currMonth = new Date(firstDay.getTime());
  while (currMonth <= lastDay) {
    months.push(currMonth.toLocaleString("default", { month: "long" }));
    currMonth.setMonth(currMonth.getMonth() + 1);
  }

  return months;
};

// Helper function to get the index of the month for a given date
const getMonthIndex = (date, months) => {
  const monthStr = date.toLocaleString("default", { month: "long" });

  return months.findIndex((month) => monthStr === month);
};
