import { apiClient } from '@/services/apiClient';

export type CompanyType = {
  id: string;
  name: string;
  description: string;
};

export type CompanySignupPayload = {
  company: {
    name: string;
    abbr: string;
    companyTypeId: string;
  };
  admin: {
    fullName: string;
    email: string;
    password: string;
    confirmPassword: string;
    country: string;
    phone: string;
  };
  termsAccepted: boolean;
};

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
};

export function getCompanyTypes() {
  return apiClient<ApiResponse<CompanyType[]>>('/company-type').then((response) => response.data);
}

export function signupCompany(payload: CompanySignupPayload) {
  return apiClient<ApiResponse<unknown>>('/company/signup', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
