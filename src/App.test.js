import { render, screen, waitFor } from '@testing-library/react';
import App from './App';

test('renders KPC AI Lab loading text', async () => {
  render(<App />);
  
  // 로딩 텍스트가 나타나는지 확인
  const loadingElement = screen.getByText(/KPC AI Lab 로딩 중.../i);
  expect(loadingElement).toBeInTheDocument();
});

test('renders app without crashing', () => {
  render(<App />);
  // 앱이 오류 없이 렌더링되는지 확인
  expect(document.body).toBeInTheDocument();
});
