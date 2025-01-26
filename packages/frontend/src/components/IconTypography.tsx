import Typography, { TypographyProps } from "@mui/material/Typography";
import { ElementType } from "react";

interface Props {
  Icon: ElementType;
  text?: string | number | boolean;
  prefix?: string;
  suffix?: string;
  variant?: TypographyProps["variant"];
  color?: TypographyProps["color"];
}

/**
 * Renders an Icon/Text pair
 * @param Icon The icon component to display
 * @param text The text content to display
 * @param prefix Optional prefix to prepend to the text
 * @param suffix Optional suffix to append to the text
 * @param variant Typography variant
 * @param color Typography color
 */
export const IconTypography = ({
  Icon,
  text,
  prefix,
  suffix,
  variant = "body2",
  color = "textPrimary",
}: Props) => {
  // Allow 0 to be displayed
  if (!text && text !== 0) return null;

  let displayText = prefix ? `${prefix} ${text}` : text;
  displayText = suffix ? `${displayText} ${suffix}` : displayText;

  return (
    <Typography
      variant={variant}
      color={color}
      display="flex"
      alignItems="center"
      gap={1}
    >
      <Icon size={16} />
      {displayText}
    </Typography>
  );
};
