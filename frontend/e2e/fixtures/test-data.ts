export const mockSessionData = {
  id: 'session1',
  name: 'Test Rehearsal',
  date_time: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
  description: 'Test rehearsal description',
  default_attendance_state: 'will_be_present',
  orchestras: ['orchestra1'],
  expand: {
    orchestras: [
      { id: 'orchestra1', name: 'Test Orchestra' }
    ]
  }
};

export const mockAttendanceData = [
  {
    id: 'att1',
    state: 'will_be_present',
    expand: {
      session: mockSessionData,
      orchestra_member: {
        id: 'member1',
        expand: {
          user: {
            id: 'user1',
            name: 'Test User',
            email: 'test@example.com'
          },
          section: {
            id: 'section1',
            name: 'Trumpet'
          }
        }
      }
    }
  }
];

export const mockVolunteeringData = [
  {
    id: 'vol1',
    name: 'Test Volunteer Job',
    date_time: new Date(Date.now() + 86400000).toISOString(),
    description: 'Help with setup',
    number_needed: 3,
    signed_up: 1,
    still_needed: 2
  }
];

export const mockBannerData = [
  {
    id: 'banner1',
    message: 'Important announcement for testing',
    active: true,
    link: null
  }
];

export const mockUserData = {
  id: 'user1',
  name: 'Test User',
  email: 'test@example.com',
  leden_app_session_admin: false,
  leden_app_volunteer_admin: false,
  leden_app_banner_admin: false
};