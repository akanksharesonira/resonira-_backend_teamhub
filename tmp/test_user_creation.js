async function testUserCreation() {
    const loginUrl = 'http://localhost:5000/api/v1/auth/login';
    const createUrl = 'http://localhost:5000/api/v1/admin/users';

    try {
        // 1. Login as Admin
        console.log('Logging in as admin...');
        const loginRes = await fetch(loginUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@resonira.com',
                password: 'Admin@123'
            })
        });
        const loginData = await loginRes.json();
        if (!loginRes.ok) throw new Error(loginData.message);
        
        const token = loginData.data.token;
        console.log('Login successful. Token acquired.');

        // 2. Create a Manager
        console.log('Creating a manager user...');
        const createRes = await fetch(createUrl, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify({
                name: 'Test Manager',
                email: 'test_manager_z@resonira.com',
                password: 'Password@123',
                role: 'Manager',
                mobileNumber: '1234567890'
            })
        });

        const createData = await createRes.json();
        if (!createRes.ok) {
            console.error('Status:', createRes.status);
            console.error('Message:', createData.message);
            return;
        }

        console.log('User created successfully!');
        console.log(JSON.stringify(createData, null, 2));

    } catch (error) {
        console.error('Test failed:', error.message);
    }
}

testUserCreation();
