const API_BASE_URL = window.location.origin;

export interface User {
  id: string;
  username: string;
  email: string;
  storeConfig: {
    name: string;
    greeting: string;
    deliveryFee: number;
    pixKey: string;
    address: string;
    menuImage: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

class AuthService {
  private currentUser: User | null = null;

  async login(credentials: LoginCredentials): Promise<User> {
    try {
      console.log('Tentando login em:', `${API_BASE_URL}/api/auth/login`);
      console.log('Credenciais:', { email: credentials.email, password: '***' });
      
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Erro na resposta:', errorData);
        throw new Error(`Erro no login: ${response.status} ${response.statusText}`);
      }

      const user = await response.json();
      console.log('Login bem-sucedido:', user);
      
      this.currentUser = user;
      localStorage.setItem('user', JSON.stringify(user));
      
      return user;
    } catch (error) {
      console.error('Erro no login:', error);
      throw error;
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        this.currentUser = JSON.parse(userStr);
        return this.currentUser;
      }
      return null;
    } catch (error) {
      console.error('Erro ao obter usuário atual:', error);
      return null;
    }
  }

  async getUserConfig(userId: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/user/${userId}/config`);
      if (!response.ok) {
        throw new Error('Erro ao obter configurações');
      }
      return await response.json();
    } catch (error) {
      console.error('Erro ao obter configurações:', error);
      throw error;
    }
  }

  async updateUserConfig(userId: string, config: any) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/user/${userId}/config`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });
      
      if (!response.ok) {
        throw new Error('Erro ao atualizar configurações');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Erro ao atualizar configurações:', error);
      throw error;
    }
  }

  logout() {
    this.currentUser = null;
    localStorage.removeItem('user');
  }

  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  getCurrentUserSync(): User | null {
    return this.currentUser;
  }
}

export const authService = new AuthService(); 