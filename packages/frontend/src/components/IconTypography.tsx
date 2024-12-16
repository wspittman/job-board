import Typography, { TypographyProps } from "@mui/material/Typography";
import { ElementType } from "react";

interface Props {
  Icon: ElementType;
  text?: string | number;
  suffix?: string;
  variant?: TypographyProps["variant"];
  color?: TypographyProps["color"];
}

/**
 * Renders an Icon/Text pair
 * @param Icon The icon component to display
 * @param text The text content to display
 * @param suffix Optional suffix to append to the text
 * @param variant Typography variant
 * @param color Typography color
 */
export const IconTypography = ({
  Icon,
  text,
  suffix,
  variant = "body2",
  color = "textPrimary",
}: Props) => {
  if (!text) return null;

  return (
    <Typography
      variant={variant}
      color={color}
      display="flex"
      alignItems="center"
      gap={1}
    >
      <Icon size={16} />
      {suffix ? `${text} ${suffix}` : text}
    </Typography>
  );
};
