import { AxiosInstance } from 'axios';

export interface HttpAdapter {
  get<T>(url: string): Promise<T>;
}
