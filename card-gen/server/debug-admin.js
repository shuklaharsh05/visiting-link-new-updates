import jwt from 'jsonwebtoken';

// Test admin login logic
const testAdminLogin = () => {
  const { username, password } = { username: 'admin', password: 'admin123' };
  
  // Check against environment variables
  const adminUsername = process.env.ADMIN_USERNAME || 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  
  console.log('Testing admin login:');
  console.log('Input username:', username);
  console.log('Input password:', password);
  console.log('Expected username:', adminUsername);
  console.log('Expected password:', adminPassword);
  console.log('Username match:', username === adminUsername);
  console.log('Password match:', password === adminPassword);
  
  if (username === adminUsername && password === adminPassword) {
    console.log('✅ Admin login would succeed');
    
    // Test JWT creation
    const token = jwt.sign({ 
      id: 'admin', 
      role: 'admin',
      username: adminUsername 
    }, process.env.JWT_SECRET || 'fallback-secret', { expiresIn: "30d" });
    
    console.log('✅ JWT token created:', token.substring(0, 50) + '...');
  } else {
    console.log('❌ Admin login would fail');
  }
};

testAdminLogin();
