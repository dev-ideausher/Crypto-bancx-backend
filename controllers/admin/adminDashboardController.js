const catchAsync = require("../../utils/catchAsync");
const AppError = require("../../utils/appError");

const ViewsModel = require("../../models/viewsModel");

// admin dashboard analytics
exports.analytics = catchAsync(async (req, res, next) => {

    let {duration,type} = req.query

    let filter = {};

    const currentDate = new Date();
    
    switch (duration) {
      case 'week':
        // 15 days before the current date
        const firstDayWeek = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 15);
        filter.createdAt = { $gte: firstDayWeek, $lte: currentDate };
        break;
      case 'month':
        // 2.5 months before the current date
        const firstDayMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 2, currentDate.getDate());
        filter.createdAt = { $gte: firstDayMonth, $lte: currentDate };
        break;
      case 'year':
        // 2 years and 1 month before the current date
        const firstDayYear = new Date(currentDate.getFullYear() - 2, currentDate.getMonth() - 1, currentDate.getDate());
        filter.createdAt = { $gte: firstDayYear, $lte: currentDate };
        break;
      default:
        return next(new AppError("duration query is needed", 403));
    }
    
    filter.type = type;
    
    let views = await ViewsModel.find(filter);

    let result = {}
    switch (duration) {
      case 'week':
        result = groupByDay(views);
        break;
      case 'month':
        result = groupByWeek(views);
        break;
      case 'year':
        result = groupByMonth(views);
        break;
      default:
        return next(new AppError("duration query is needed", 403));
    }

    return res.status(200).json({
      status: true,
      message:"total views",
      result:result,
    });
});

// Helper function to group views by week
const groupByDay = (views) => {
  const byWeek = {
    views: [],
    data: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
  };

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
    byWeek.views.push(0); // Add initial count 0 for each day
    currDay.setDate(currDay.getDate() + 1);
  }

  // Iterate over the views
  views.forEach((view) => {
    // Check if the createdAt is within the week
    if (view.createdAt >= firstDay && view.createdAt <= endDay) {
      let dayIndex = view.createdAt.getDay() - 1; // Get the day index (0-6)

      // Increment the count for the corresponding day
      byWeek.views[dayIndex] += 1;
    }
  });

  return byWeek;
};


////////////////////////////////////////////////////

//previous month group by week
const groupByWeek = (views, duration) => {
  const counts = {};
  const result = {
    views: [],
    data: [],
  };

  // Get the current date and month
  const currentDate = new Date('2023-05-19T14:42:10.122Z');
  currentDate.setUTCHours(0, 0, 0, 0);
  console.log("currentDate",currentDate)
  const currentMonth = currentDate.getMonth();
  console.log("currentMonth",currentMonth)
  // Get the previous month
  const previousMonth = new Date(currentDate.getFullYear(), currentMonth - 1, 1);
  if (currentMonth === 0) {
    // Adjust the year if the current month is January
    previousMonth.setFullYear(previousMonth.getFullYear() - 1);
  }

  console.log("previousMonth",previousMonth)
  // Get the starting and ending dates of the previous month
  const previousMonthFirstDay = new Date(previousMonth.getFullYear(), previousMonth.getMonth(), 1);
  const previousMonthLastDay = new Date(previousMonth.getFullYear(), previousMonth.getMonth() + 1, 0);
  console.log("previousMonthFirstDay",previousMonthFirstDay)
  console.log("previousMonthLastDay",previousMonthLastDay)

  // Get the first Sunday in the previous month
  const firstSunday = new Date(previousMonthFirstDay);
  firstSunday.setDate(previousMonthFirstDay.getDate() + (7 - previousMonthFirstDay.getDay()));
  console.log('first sun',firstSunday)

  // Get the last Saturday in the previous month
  const lastSaturday = new Date(previousMonthLastDay);
  lastSaturday.setDate(previousMonthLastDay.getDate() - (previousMonthLastDay.getDay() + 1) % 7);
  console.log('last sat',lastSaturday)

  // Calculate the number of weeks in the previous month
  let weekCount = Math.ceil((lastSaturday.getDate() - firstSunday.getDate() + 1) / 7);
  console.log("week count",weekCount)

  // Check if there are days after the last Saturday until the last day of the month
  if (lastSaturday < previousMonthLastDay) {
    weekCount++;
  }
  let isfirstSundayWeek = 0
  if (firstSunday > previousMonthFirstDay) {
    weekCount++;
    isfirstSundayWeek = 1
  }

  // Initialize the view counts for each week
  for (let i = 1; i <= weekCount; i++) {
    counts[`week${i}`] = 0;
  }

  // Iterate over the views
  views.forEach((view) => {
    // Check if the createdAt is within the previous month
    if (view.createdAt >= previousMonthFirstDay && view.createdAt <= previousMonthLastDay) {
      const viewDate = new Date(view.createdAt);
      let weekIndex;

      // Check if the view date is before the first Sunday
      if (viewDate < firstSunday) {
        weekIndex = 1;
        console.log("weekIndex",weekIndex,"  view.createdAt", view.createdAt)
      }
      // Check if the view date is after the last Saturday
      else if (viewDate > lastSaturday) {
        weekIndex = weekCount;
      }
      // Calculate the week index based on the view date
      else {
        weekIndex = Math.ceil((viewDate.getDate() - firstSunday.getDate() + 1) / 7)+isfirstSundayWeek;
        console.log("weekIndex",weekIndex,"  view.createdAt", view.createdAt)
      }

      counts[`week${weekIndex}`]++;
    }
  });

  // Add the view counts to the result
  for (let i = 1; i <= weekCount; i++) {
    result.views.push(counts[`week${i}`]);
    result.data.push(`week${i}`);
  }

  return result;
};


///////////////////////////////////////////////

const groupByMonth = (views, duration) => {
  const counts = [];
  const months = [];

  // Get the current date and time
  const currentDate = new Date();

  // Calculate the first and last day of the last complete year
  const lastYear = currentDate.getFullYear() - 1;
  const lastYearFirstDay = new Date(lastYear, 0, 1);
  const lastYearLastDay = new Date(lastYear, 11, 31);

  // Split the last complete year data into months
  const monthsArray = splitIntoMonths(lastYearFirstDay, lastYearLastDay);

  // Initialize the month-based data structure
  monthsArray.forEach((month) => {
    months.push(month);
    counts.push(0);
  });

  // Iterate over the views
  views.forEach((view) => {
    // Check if the createdAt is within the last complete year
    if (view.createdAt >= lastYearFirstDay && view.createdAt <= lastYearLastDay) {
      const monthIndex = getMonthIndex(view.createdAt, monthsArray);

      // Increment the count for the corresponding month
      if (monthIndex !== -1) {
        counts[monthIndex] += 1;
      }
    }
  });

  return { views: counts, data:months };
};

// Helper function to split a given year into months
const splitIntoMonths = (firstDay, lastDay) => {
  const months = [];

  let currMonth = new Date(firstDay.getTime());
  while (currMonth <= lastDay) {
    months.push(currMonth.toLocaleString("default", { month: "short" }));
    currMonth.setMonth(currMonth.getMonth() + 1);
  }

  return months;
};

// Helper function to get the index of the month for a given date
const getMonthIndex = (date, months) => {
  const monthStr = date.toLocaleString("default", { month: "short" });

  return months.findIndex((month) => monthStr === month);
};
