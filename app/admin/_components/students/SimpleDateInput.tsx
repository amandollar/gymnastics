/** Native date input with a visible calendar control (recent dates). */
export default function SimpleDateInput({
  name,
  required,
  max,
  min,
  defaultValue,
  className,
}: {
  name: string;
  required?: boolean;
  max?: string;
  min?: string;
  defaultValue?: string;
  className: string;
}) {
  return (
    <input
      type="date"
      name={name}
      required={required}
      max={max}
      min={min}
      defaultValue={defaultValue}
      className={`${className} [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-60 hover:[&::-webkit-calendar-picker-indicator]:opacity-100 dark:[&::-webkit-calendar-picker-indicator]:invert`}
    />
  );
}
