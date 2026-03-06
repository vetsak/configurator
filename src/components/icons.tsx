export function ChatbotIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 17 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M0.6 2.35V16.17C0.6 16.56 1.07 16.75 1.35 16.48L4.72 13.1C4.88 12.94 5.1 12.85 5.34 12.85H14.6C15.57 12.85 16.35 12.07 16.35 11.1V2.35C16.35 1.38 15.57 0.6 14.6 0.6H2.35C1.38 0.6 0.6 1.38 0.6 2.35Z" stroke="black" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function MenuDotsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="4.375" cy="10.5" r="1.75" fill="black"/>
      <circle cx="10.5" cy="10.5" r="1.75" fill="black"/>
      <circle cx="16.625" cy="10.5" r="1.75" fill="black"/>
    </svg>
  );
}

export function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 26 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M0 0H25.57V23.75H6C2.69 23.75 0 21.06 0 17.75V0Z" fill="#EEEEEE" fillOpacity="0.8"/>
      <path d="M7.16 11.72H18.07M12.62 6.65V16.78" stroke="black" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function CheckmarkIcon({ className, color = 'white' }: { className?: string; color?: string }) {
  return (
    <svg className={className} viewBox="0 0 15 11" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14.94 1.64L5.64 10.94C5.56 11.02 5.42 11.02 5.34 10.94L0.06 5.66C-0.02 5.58 -0.02 5.45 0.06 5.36L1.34 4.08C1.43 4 1.56 4 1.64 4.08L5.49 7.93L13.36 0.06C13.44 -0.02 13.57 -0.02 13.66 0.06L14.94 1.34C15.02 1.43 15.02 1.56 14.94 1.64Z" fill={color}/>
    </svg>
  );
}

export function InfoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="10" cy="10" r="9" stroke="black" strokeWidth="1.2"/>
      <path d="M10 9V14" stroke="black" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="10" cy="6.5" r="0.75" fill="black"/>
    </svg>
  );
}

export function ColorSwatchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2.25 5.25C2.25 3.84 2.25 3.13 2.69 2.69C3.13 2.25 3.84 2.25 5.25 2.25C6.66 2.25 7.37 2.25 7.81 2.69C8.25 3.13 8.25 3.84 8.25 5.25V9V12.75C8.25 14.16 8.25 14.87 7.81 15.31C7.37 15.75 6.66 15.75 5.25 15.75C3.84 15.75 3.13 15.75 2.69 15.31C2.25 14.87 2.25 14.16 2.25 12.75V9V5.25Z" stroke="#323232" strokeLinejoin="round"/>
      <path d="M8.25 5.63L9.5 4.37C10.5 3.37 11 2.87 11.63 2.87C12.25 2.87 12.75 3.37 13.75 4.37L14.38 5C15.38 6 15.88 6.5 15.88 7.13C15.88 7.75 15.38 8.25 14.38 9.25L8.25 15.38" stroke="#323232" strokeLinejoin="round"/>
      <path d="M5.25 15.75H12.75C14.16 15.75 14.87 15.75 15.31 15.31C15.75 14.87 15.75 14.16 15.75 12.75V11.63C15.75 11.28 15.75 11.1 15.72 10.96C15.6 10.36 15.14 9.9 14.54 9.78C14.4 9.75 14.22 9.75 13.88 9.75" stroke="#323232" strokeLinejoin="round"/>
      <circle cx="5.25" cy="12.75" r="0.75" fill="#323232"/>
    </svg>
  );
}

export function SupportIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8.67 6.58C8.77 5.52 9.14 4.52 9.74 3.64C10.33 2.77 11.14 2.06 12.08 1.58C13.03 1.1 14.07 0.87 15.13 0.9C16.19 0.94 17.22 1.23 18.13 1.77C19.04 2.3 19.8 3.06 20.34 3.97C20.89 4.87 21.19 5.9 21.23 6.96C21.27 8.01 21.05 9.06 20.58 10.01C20.12 10.94 19.43 11.74 18.59 12.34" stroke="black" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9.53 4.02C10.5 5.03 11.67 5.83 12.96 6.38C14.25 6.92 15.64 7.2 17.04 7.2C18.42 7.2 19.78 6.93 21.06 6.4" stroke="black" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="13.59" cy="13.5" r="1.8" stroke="black" strokeWidth="1.8"/>
      <path d="M15.39 14.1L21 19.71" stroke="black" strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M18.6 22.11H24.9C25.73 22.11 26.4 21.44 26.4 20.61V15.81C26.4 14.98 25.73 14.31 24.9 14.31H18.6C17.77 14.31 17.1 14.98 17.1 15.81V20.61C17.1 21.44 17.77 22.11 18.6 22.11Z" stroke="black" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M20.1 17.61H23.4" stroke="black" strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M20.1 19.71H22.2" stroke="black" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}

export function TruckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 37 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 1H26.5V14.5H8.5" stroke="black" strokeWidth="1.2" strokeLinejoin="round"/>
      <path d="M26.5 4H31.5L35.5 8V14.5H34" stroke="black" strokeWidth="1.2" strokeLinejoin="round"/>
      <circle cx="11.5" cy="14.5" r="2.5" stroke="black" strokeWidth="1.2"/>
      <circle cx="31" cy="14.5" r="2.5" stroke="black" strokeWidth="1.2"/>
      <path d="M14 14.5H26.5" stroke="black" strokeWidth="1.2"/>
    </svg>
  );
}
