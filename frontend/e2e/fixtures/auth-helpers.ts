import { Page } from '@playwright/test';

export interface TestUser {
  email: string;
  password?: string;
  isSessionAdmin?: boolean;
  isVolunteerAdmin?: boolean;
  isBannerAdmin?: boolean;
}

export const TEST_USERS: Record<string, TestUser> = {
  regularUser: {
    email: 'user@example.com',
    isSessionAdmin: false,
    isVolunteerAdmin: false,
    isBannerAdmin: false,
  },
  sessionAdmin: {
    email: 'session-admin@example.com',
    isSessionAdmin: true,
    isVolunteerAdmin: false,
    isBannerAdmin: false,
  },
  volunteerAdmin: {
    email: 'volunteer-admin@example.com',
    isSessionAdmin: false,
    isVolunteerAdmin: true,
    isBannerAdmin: false,
  },
  bannerAdmin: {
    email: 'banner-admin@example.com',
    isSessionAdmin: false,
    isVolunteerAdmin: false,
    isBannerAdmin: true,
  },
  superAdmin: {
    email: 'super-admin@example.com',
    isSessionAdmin: true,
    isVolunteerAdmin: true,
    isBannerAdmin: true,
  },
};

export class AuthHelper {
  constructor(private page: Page) {}

  async login(userType: keyof typeof TEST_USERS = 'regularUser') {
    const user = TEST_USERS[userType];
    
    // Navigate to login page
    await this.page.goto('/');
    
    // Fill in email
    await this.page.fill('input[type="email"]', user.email);
    
    // Click login button
    await this.page.click('button[type="submit"]');
    
    // Wait for OTP input (mocked in tests)
    await this.page.waitForSelector('input[placeholder*="code"]');
    
    // Fill in mock OTP
    await this.page.fill('input[placeholder*="code"]', '123456');
    
    // Submit OTP
    await this.page.click('button[type="submit"]');
    
    // Wait for successful login (navigation to home)
    await this.page.waitForURL('/');
    await this.page.waitForSelector('h2:has-text("Repetities en optredens")');
  }

  async logout() {
    // Click on user menu (typically in header)
    await this.page.click('[data-testid="user-menu"]');
    
    // Click logout button
    await this.page.click('button:has-text("Logout")');
    
    // Wait for redirect to login
    await this.page.waitForSelector('input[type="email"]');
  }

  async mockAuthenticatedUser(userType: keyof typeof TEST_USERS = 'regularUser') {
    const user = TEST_USERS[userType];
    
    await this.page.addInitScript((userData) => {
      // Create a mock JWT token that will pass PocketBase validation
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const payload = btoa(JSON.stringify({
        sub: `mock-user-${Math.random()}`,
        email: userData.email,
        exp: Math.floor(Date.now() / 1000) + 3600, // Expires in 1 hour
        iat: Math.floor(Date.now() / 1000)
      }));
      const signature = btoa('mock-signature');
      const mockToken = `${header}.${payload}.${signature}`;
      
      const mockAuthData = {
        token: mockToken,
        record: {
          id: `mock-user-${Math.random()}`,
          email: userData.email,
          name: userData.email.split('@')[0],
          leden_app_session_admin: userData.isSessionAdmin,
          leden_app_volunteer_admin: userData.isVolunteerAdmin,
          leden_app_banner_admin: userData.isBannerAdmin,
        },
      };
      
      // Set the correct localStorage key that PocketBase uses
      const baseUrl = 'http://127.0.0.1:8090';
      const pbKey = 'pocketbase_auth_' + baseUrl.replace(/[^\w]/g, '_');
      localStorage.setItem(pbKey, JSON.stringify(mockAuthData));
      
      // Also try the common key
      localStorage.setItem('pocketbase_auth', JSON.stringify(mockAuthData));
      
      // Store mock data globally
      window.__TEST_AUTH_DATA = mockAuthData;
    }, user);
  }

  async setupMockAPI() {
    // Mock PocketBase API responses - PocketBase uses port 8090 by default
    await this.page.route('**/api/collections/**', async (route) => {
      const url = route.request().url();
      const method = route.request().method();
      
      console.log('Intercepting:', method, url); // Debug log
      
      // Mock OTP request
      if (url.includes('/collections/users/request-otp') && method === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            otpId: 'mock-otp-id-123'
          })
        });
        return;
      }
      
      // Mock OTP verification
      if (url.includes('/collections/users/auth-with-otp') && method === 'POST') {
        const body = await route.request().postData();
        const data = JSON.parse(body || '{}');
        
        console.log('OTP verification request:', data);
        
        // Simulate invalid OTP
        if (data.password === '000000') {
          await route.fulfill({
            status: 400,
            contentType: 'application/json',
            body: JSON.stringify({
              message: 'Invalid OTP'
            })
          });
          return;
        }
        
        // Create a proper JWT token
        const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
        const payload = btoa(JSON.stringify({
          id: 'mock-user-123',
          email: 'test@example.com',
          exp: Math.floor(Date.now() / 1000) + 3600,
          iat: Math.floor(Date.now() / 1000)
        }));
        const signature = btoa('mock-signature');
        const mockToken = `${header}.${payload}.${signature}`;
        
        const response = {
          token: mockToken,
          record: {
            id: 'mock-user-123',
            email: 'test@example.com',
            name: 'test',
            leden_app_session_admin: false,
            leden_app_volunteer_admin: false,
            leden_app_banner_admin: false,
          }
        };
        
        console.log('OTP verification response:', response);
        
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(response)
        });
        return;
      }
      
      // Mock attendance data
      if (url.includes('/collections/attendance') && method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            items: [
              {
                id: 'att1',
                state: 'will_be_present',
                expand: {
                  session: {
                    name: 'Mock Rehearsal',
                    date_time: new Date(Date.now() + 86400000).toISOString(),
                    expand: {
                      orchestras: [{ name: 'Mock Orchestra' }]
                    }
                  }
                }
              }
            ]
          })
        });
        return;
      }
      
      // Mock banner messages
      if (url.includes('/collections/banner_messages') && method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            items: [
              {
                id: 'banner1',
                message: 'Mock banner message',
                active: true
              }
            ]
          })
        });
        return;
      }
      
      // Mock individual volunteering job
      if (url.includes('/collections/volunteering/records/vol1') && method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'vol1',
            name: 'Setup Help',
            date_time: new Date(Date.now() + 86400000).toISOString(),
            description: 'Help with stage setup',
            number_needed: 3,
            expand: {
              volunteering_attendance_via_volunteering: [
                { id: 'att1', user: 'user1' }
              ]
            }
          })
        });
        return;
      }
      
      // Mock volunteering jobs list
      if (url.includes('/collections/volunteering') && method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            items: [
              {
                id: 'vol1',
                name: 'Setup Help',
                date_time: new Date(Date.now() + 86400000).toISOString(),
                description: 'Help with stage setup',
                number_needed: 3,
                expand: {
                  volunteering_attendance_via_volunteering: [
                    { id: 'att1', user: 'user1' }
                  ]
                }
              },
              {
                id: 'vol2', 
                name: 'Sound Check',
                date_time: new Date(Date.now() + 172800000).toISOString(),
                description: 'Help with sound equipment',
                number_needed: 2,
                expand: {
                  volunteering_attendance_via_volunteering: []
                }
              }
            ]
          })
        });
        return;
      }
      
      // Mock volunteering job creation/update
      if (url.includes('/collections/volunteering') && (method === 'POST' || method === 'PATCH')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'new-vol-id',
            name: 'New Volunteer Job',
            date_time: new Date().toISOString(),
            description: 'New job description',
            number_needed: 1
          })
        });
        return;
      }
      
      // Default empty response
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ items: [] })
      });
    });

    // Also mock the port 8090 calls specifically
    await this.page.route('**/8090/api/collections/**', async (route) => {
      const url = route.request().url();
      const method = route.request().method();
      
      console.log('Intercepting PocketBase:', method, url); // Debug log
      
      // Mock OTP request
      if (url.includes('/collections/users/request-otp') && method === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            otpId: 'mock-otp-id-123'
          })
        });
        return;
      }
      
      // Mock OTP verification
      if (url.includes('/collections/users/auth-with-otp') && method === 'POST') {
        const body = await route.request().postData();
        const data = JSON.parse(body || '{}');
        
        console.log('OTP verification request:', data);
        
        // Simulate invalid OTP
        if (data.password === '000000') {
          await route.fulfill({
            status: 400,
            contentType: 'application/json',
            body: JSON.stringify({
              message: 'Invalid OTP'
            })
          });
          return;
        }
        
        // Create a proper JWT token
        const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
        const payload = btoa(JSON.stringify({
          id: 'mock-user-123',
          email: 'test@example.com',
          exp: Math.floor(Date.now() / 1000) + 3600,
          iat: Math.floor(Date.now() / 1000)
        }));
        const signature = btoa('mock-signature');
        const mockToken = `${header}.${payload}.${signature}`;
        
        const response = {
          token: mockToken,
          record: {
            id: 'mock-user-123',
            email: 'test@example.com',
            name: 'test',
            leden_app_session_admin: false,
            leden_app_volunteer_admin: false,
            leden_app_banner_admin: false,
          }
        };
        
        console.log('OTP verification response:', response);
        
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(response)
        });
        return;
      }
      
      // Mock attendance data
      if (url.includes('/collections/attendance') && method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            items: [
              {
                id: 'att1',
                state: 'will_be_present',
                expand: {
                  session: {
                    name: 'Mock Rehearsal',
                    date_time: new Date(Date.now() + 86400000).toISOString(),
                    expand: {
                      orchestras: [{ name: 'Mock Orchestra' }]
                    }
                  }
                }
              }
            ]
          })
        });
        return;
      }
      
      // Mock banner messages
      if (url.includes('/collections/banner_messages') && method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            items: [
              {
                id: 'banner1',
                message: 'Mock banner message',
                active: true
              }
            ]
          })
        });
        return;
      }
      
      // Mock individual volunteering job
      if (url.includes('/collections/volunteering/records/vol1') && method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'vol1',
            name: 'Setup Help',
            date_time: new Date(Date.now() + 86400000).toISOString(),
            description: 'Help with stage setup',
            number_needed: 3,
            expand: {
              volunteering_attendance_via_volunteering: [
                { id: 'att1', user: 'user1' }
              ]
            }
          })
        });
        return;
      }
      
      // Mock volunteering jobs list
      if (url.includes('/collections/volunteering') && method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            items: [
              {
                id: 'vol1',
                name: 'Setup Help',
                date_time: new Date(Date.now() + 86400000).toISOString(),
                description: 'Help with stage setup',
                number_needed: 3,
                expand: {
                  volunteering_attendance_via_volunteering: [
                    { id: 'att1', user: 'user1' }
                  ]
                }
              },
              {
                id: 'vol2', 
                name: 'Sound Check',
                date_time: new Date(Date.now() + 172800000).toISOString(),
                description: 'Help with sound equipment',
                number_needed: 2,
                expand: {
                  volunteering_attendance_via_volunteering: []
                }
              }
            ]
          })
        });
        return;
      }
      
      // Mock volunteering job creation/update
      if (url.includes('/collections/volunteering') && (method === 'POST' || method === 'PATCH')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'new-vol-id',
            name: 'New Volunteer Job',
            date_time: new Date().toISOString(),
            description: 'New job description',
            number_needed: 1
          })
        });
        return;
      }
      
      // Default empty response
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ items: [] })
      });
    });
  }
}