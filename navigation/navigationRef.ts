import { createNavigationContainerRef } from '@react-navigation/native';

// Global navigation ref -- dung de navigate tu ngoai component (api interceptors, etc.)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const navigationRef = createNavigationContainerRef<any>();
