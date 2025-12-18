
import { Language } from '../types';

// Define individual language translations to maintain clarity and satisfy Record<Language, any>
const en = {
  nav: {
    dashboard: 'Dashboard',
    findMentor: 'Find Mentor',
    bookings: 'My Bookings',
    subscriptions: 'Subscriptions',
    homework: 'Homework',
    messages: 'Messages',
    wallet: 'Wallet',
    profile: 'Profile',
    signOut: 'Sign Out'
  },
  common: {
    loading: 'Loading...',
    back: 'Back',
    confirm: 'Confirm',
    cancel: 'Cancel',
    save: 'Save',
    processing: 'Processing...',
    actions: 'Actions',
    date: 'Date',
    time: 'Time',
    status: 'Status',
    mentor: 'Mentor',
    student: 'Student',
    next: 'Next',
    submit: 'Submit',
    viewAll: 'View All',
    enterClass: 'Enter Class'
  },
  auth: {
    login: 'Log In',
    register: 'Sign Up',
    emailLabel: 'Your Email',
    passwordLabel: 'Password',
    fullNameLabel: 'Full Name',
    forgotPassword: 'Forgot Password?',
    enterSystem: 'Enter System',
    readme: 'System Documentation (README)',
    registerSuccess: 'Register successful! Redirecting...',
    loginFailed: 'Login failed. Please try again.',
    emailNotExists: 'Email does not exist.',
    quickAccess: 'Development Access',
    resetData: 'Reset System Data',
    resetConfirm: 'Are you sure you want to clear all data and re-initialize mock accounts?',
    chooseRole: 'I want to register as...',
    menteeRole: 'Student',
    mentorRole: 'Teaching Mentor',
    providerRole: 'Affiliate Provider',
    completeRegister: 'Complete Registration'
  },
  mentee: {
    welcome: 'Welcome back',
    readyToLearn: 'Are you ready for your next English lesson?',
    creditsRemaining: 'credits remaining',
    bookLesson: 'Book a Lesson',
    nextLesson: 'Next Lesson',
    noUpcoming: 'No upcoming lessons scheduled.',
    viewDetails: 'View Details',
    weeklyGoal: 'Weekly Goal',
    lessons: 'Lessons',
    homework: 'Homework',
    pending: 'Pending',
    streak: 'Streak',
    days: 'Days',
    homeworkTitle: 'Homework & Assignments',
    noHomework: 'No homework assigned yet.',
    allDone: 'All done!',
    submit: 'Submit',
    wallet: 'My Wallet',
    availableBalance: 'Available Balance',
    topUp: 'Top Up',
    transactionHistory: 'Transaction History',
    
    findMentorTitle: 'Find a Mentor',
    findMentorSubtitle: 'Browse and book sessions with top English experts.',
    searchPlaceholder: 'Search name or tag...',
    filters: 'Filters',
    viewProfile: 'View Profile',
    perHour: '/ hour',

    myBookings: 'My Bookings',
    buySubscription: 'Buy Subscription',
    bookNewLesson: 'Book New Lesson',
    noBookingsTitle: 'No bookings yet',
    noBookingsDesc: 'Start your journey by finding a mentor.',
    scheduled: 'Scheduled',
    completed: 'Completed',
    cancelled: 'Cancelled',
    rescheduled: 'Rescheduled',
    
    upgradeTitle: 'Upgrade to Premium',
    upgradeDesc: 'Commit to your learning journey with a monthly plan. Get consistent practice and save up to 20% compared to credit packs.',
    activePlan: 'You have an active {plan} subscription',
    validUntil: 'Valid until',
    manageSubscription: 'Manage Subscription',
    choosePlan: 'Choose Plan',
    currentPlan: 'Current Plan',
    lessonsCount: '{count} Lessons',
    weeklySchedule: 'Weekly fixed schedule',
    quotaInfo: '{cancel} Cancel / {reschedule} Reschedule',
    
    subscriptionDetail: {
      backToList: 'Back to Plans',
      stepMentor: 'Choose Mentor',
      stepSchedule: 'Set Schedule',
      stepConfirm: 'Confirm',
      mentorTitle: 'Your Learning Guide',
      mentorSubtitle: 'Choose a mentor to accompany you for the next 4 weeks.',
      scheduleTitle: 'Set Your Weekly Routine',
      scheduleSubtitle: 'Choose recurring slots that fit your weekly schedule.',
      projectedSchedule: 'Projected Schedule',
      noSlots: 'No slots selected',
      recurring: 'Recurring',
      nextStep: 'Summary & Payment',
      summaryTitle: 'Confirm Subscription',
      summarySubtitle: 'Please review your plan details.',
      planLabel: 'Learning Plan',
      sessionsSuffix: 'Lessons / 4 weeks',
      mentorLabel: 'Partner Mentor',
      roadmapLabel: 'Next 4 Weeks Roadmap',
      totalPrice: 'Total Price',
      walletBalance: 'Current Wallet',
      confirmAndStart: 'Confirm & Start Learning',
      insufficientTitle: 'Insufficient Balance',
      insufficientDesc: 'You need {needed} more Credits to complete this registration.',
      topUpNow: 'Top up now'
    },

    calendar: {
      title: 'Choose {count} fixed slots per week',
      selectedCount: 'Selected: {current} / {max}',
      note: '* Green slots indicate mentor availability. Choose recurring weekly times.'
    },

    activeSubscriptionTitle: 'Active Subscription',
    usageStats: 'Usage Stats',
    totalSessions: 'Total Sessions',
    remaining: 'Remaining',
    subscriptionLimits: 'Subscription Limits',
    cancelsLeft: 'Cancels Left',
    reschedulesLeft: 'Reschedules Left',
    resetsOn: 'Resets on',
    viewSchedule: 'View Schedule',
    noActiveSub: 'No Active Subscription',
    payAsYouGo: 'You are currently on the pay-as-you-go plan.',
    browsePlans: 'Browse Plans',

    profile: {
      myProfile: 'My Profile',
      changeAvatar: 'Click camera icon to change',
      saveChanges: 'Save Changes',
      saving: 'Saving...',
      fullName: 'Full Name',
      email: 'Email',
      phone: 'Phone',
      country: 'Country'
    },

    walletModal: {
      title: 'Top Up Credits',
      paymentTotal: 'Total Payment',
      securePayment: 'Secure SSL Payment',
      payNow: 'Pay Now'
    },

    homeworkModal: {
      placeholder: 'Write your notes or answers here...',
      dropzone: 'Drag and drop files here',
      submitNow: 'Submit Now',
      submittedTitle: 'Assignment Submitted',
      submittedDesc: 'You submitted this on {date}. Waiting for feedback.'
    }
  }
};

const vi = {
  nav: {
    dashboard: 'Trang chủ',
    findMentor: 'Tìm Mentor',
    bookings: 'Lịch học',
    subscriptions: 'Gói học',
    homework: 'Bài tập',
    messages: 'Tin nhắn',
    wallet: 'Ví tiền',
    profile: 'Hồ sơ',
    signOut: 'Đăng xuất'
  },
  common: {
    loading: 'Đang tải...',
    back: 'Quay lại',
    confirm: 'Xác nhận',
    cancel: 'Hủy',
    save: 'Lưu',
    processing: 'Đang xử lý...',
    actions: 'Hành động',
    date: 'Ngày',
    time: 'Giờ',
    status: 'Trạng thái',
    mentor: 'Giảng viên',
    student: 'Học viên',
    next: 'Tiếp theo',
    submit: 'Nộp bài',
    viewAll: 'Xem tất cả',
    enterClass: 'Vào lớp học'
  },
  auth: {
    login: 'Đăng nhập',
    register: 'Đăng ký',
    emailLabel: 'Email của bạn',
    passwordLabel: 'Mật khẩu',
    fullNameLabel: 'Họ và tên',
    forgotPassword: 'Quên mật khẩu?',
    enterSystem: 'Vào hệ thống',
    readme: 'Hướng dẫn hệ thống (README)',
    registerSuccess: 'Đăng ký thành công! Đang chuyển hướng...',
    loginFailed: 'Đăng nhập thất bại. Vui lòng thử lại.',
    emailNotExists: 'Email không tồn tại.',
    quickAccess: 'Lối tắt kiểm thử',
    resetData: 'Khởi tạo lại dữ liệu',
    resetConfirm: 'Bạn có chắc chắn muốn xóa toàn bộ dữ liệu và khôi phục tài khoản mẫu?',
    chooseRole: 'Bạn muốn đăng ký là...',
    menteeRole: 'Học viên',
    mentorRole: 'Giảng viên (Mentor)',
    providerRole: 'Cộng tác viên (Affiliate)',
    completeRegister: 'Hoàn tất đăng ký'
  },
  mentee: {
    welcome: 'Chào mừng trở lại',
    readyToLearn: 'Bạn đã sẵn sàng cho buổi học tiếng Anh tiếp theo chưa?',
    creditsRemaining: 'tín chỉ còn lại',
    bookLesson: 'Đặt lịch học',
    nextLesson: 'Buổi học tiếp theo',
    noUpcoming: 'Không có buổi học nào sắp tới.',
    viewDetails: 'Xem chi tiết',
    weeklyGoal: 'Mục tiêu tuần',
    lessons: 'Buổi học',
    homework: 'Bài tập',
    pending: 'Cần làm',
    streak: 'Chuỗi',
    days: 'ngày',
    homeworkTitle: 'Bài tập về nhà',
    noHomework: 'Chưa có bài tập nào.',
    allDone: 'Đã hoàn thành hết!',
    submit: 'Nộp bài',
    wallet: 'Ví của tôi',
    availableBalance: 'Số dư khả dụng',
    topUp: 'Nạp thêm',
    transactionHistory: 'Lịch sử giao dịch',

    findMentorTitle: 'Tìm Mentor',
    findMentorSubtitle: 'Tìm kiếm và đặt lịch với các chuyên gia tiếng Anh hàng đầu.',
    searchPlaceholder: 'Tìm theo tên hoặc thẻ...',
    filters: 'Bộ lọc',
    viewProfile: 'Xem hồ sơ',
    perHour: '/ giờ',

    myBookings: 'Lịch học của tôi',
    buySubscription: 'Mua gói học',
    bookNewLesson: 'Đặt lịch mới',
    noBookingsTitle: 'Chưa có lịch học',
    noBookingsDesc: 'Hãy bắt đầu bằng việc tìm một mentor phù hợp.',
    scheduled: 'Sắp tới',
    completed: 'Hoàn thành',
    cancelled: 'Đã hủy',
    rescheduled: 'Đã dời',

    upgradeTitle: 'Nâng cấp Premium',
    upgradeDesc: 'Cam kết lộ trình học tập với gói tháng. Học đều đặn và tiết kiệm tới 20% so với mua lẻ.',
    activePlan: 'Bạn đang dùng gói {plan}',
    validUntil: 'Hết hạn ngày',
    manageSubscription: 'Quản lý gói',
    choosePlan: 'Chọn gói này',
    currentPlan: 'Gói hiện tại',
    lessonsCount: '{count} Buổi học',
    weeklySchedule: 'Lịch cố định hàng tuần',
    quotaInfo: '{cancel} lần hủy / {reschedule} lần dời',

    subscriptionDetail: {
      backToList: 'Quay lại danh sách gói',
      stepMentor: 'Chọn Mentor',
      stepSchedule: 'Lên lịch học',
      stepConfirm: 'Hoàn tất',
      mentorTitle: 'Người dẫn dắt hành trình',
      mentorSubtitle: 'Chọn một Mentor sẽ đồng hành cùng bạn trong suốt lộ trình 4 tuần.',
      scheduleTitle: 'Thiết lập thời gian biểu',
      scheduleSubtitle: 'Chọn khung giờ bạn sẽ học định kỳ hàng tuần.',
      projectedSchedule: 'Lịch học dự kiến',
      noSlots: 'Chưa chọn khung giờ',
      recurring: 'Định kỳ',
      nextStep: 'Xem tóm tắt & Thanh toán',
      summaryTitle: 'Xác nhận đăng ký',
      summarySubtitle: 'Vui lòng kiểm tra lại thông tin gói học của bạn.',
      planLabel: 'Gói học',
      sessionsSuffix: 'Buổi học / 4 tuần',
      mentorLabel: 'Mentor đồng hành',
      roadmapLabel: 'Lộ trình 4 tuần tới',
      totalPrice: 'Tổng cộng',
      walletBalance: 'Ví hiện tại',
      confirmAndStart: 'Xác nhận & Bắt đầu học',
      insufficientTitle: 'Số dư không đủ',
      insufficientDesc: 'Bạn cần thêm {needed} Credits để thực hiện giao dịch này.',
      topUpNow: 'Nạp thêm ngay'
    },

    calendar: {
      title: 'Chọn {count} khung giờ mỗi tuần',
      selectedCount: 'Đã chọn: {current} / {max}',
      note: '* Khung giờ xanh là lúc Mentor rảnh. Chọn lịch học định kỳ của bạn.'
    },

    activeSubscriptionTitle: 'Gói học đang kích hoạt',
    usageStats: 'Thống kê sử dụng',
    totalSessions: 'Tổng số buổi',
    remaining: 'Còn lại',
    subscriptionLimits: 'Giới hạn gói',
    cancelsLeft: 'Lượt hủy còn lại',
    reschedulesLeft: 'Lượt dời còn lại',
    resetsOn: 'Làm mới vào',
    viewSchedule: 'Xem lịch học',
    noActiveSub: 'Không có gói học',
    payAsYouGo: 'Bạn đang sử dụng chế độ thanh toán theo buổi.',
    browsePlans: 'Xem các gói',

    profile: {
      myProfile: 'Hồ sơ của tôi',
      changeAvatar: 'Nhấn vào ảnh để thay đổi',
      saveChanges: 'Lưu thay đổi',
      saving: 'Đang lưu...',
      fullName: 'Họ và tên',
      email: 'Email',
      phone: 'Số điện thoại',
      country: 'Quốc gia'
    },

    walletModal: {
      title: 'Nạp Credits',
      paymentTotal: 'Tổng thanh toán',
      securePayment: 'Thanh toán bảo mật SSL',
      payNow: 'Thanh toán ngay'
    },

    homeworkModal: {
      placeholder: 'Viết ghi chú hoặc câu trả lời của bạn...',
      dropzone: 'Kéo thả file bài làm vào đây',
      submitNow: 'Nộp bài ngay',
      submittedTitle: 'Bài tập đã nộp',
      submittedDesc: 'Đã nộp ngày {date}. Vui lòng chờ phản hồi.'
    }
  }
};

// Fix: Added missing properties 'zh', 'ko', 'ja' to satisfy the Language type requirement
export const translations: Record<Language, any> = {
  en,
  vi,
  zh: en, // Fallback to English for Chinese
  ko: en, // Fallback to English for Korean
  ja: en  // Fallback to English for Japanese
};
