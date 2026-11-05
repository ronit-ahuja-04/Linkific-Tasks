export default function Logo({ size = 32, color = "#FF5630" }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="15" y="10" width="30" height="80" rx="12" fill={color} />
      <rect x="55" y="10" width="30" height="45" rx="12" fill={color} />
    </svg>
  );
}
