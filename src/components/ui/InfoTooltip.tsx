import React from 'react';
import { Tooltip } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import './InfoTooltip.css';

interface InfoTooltipProps {
  title: string;
}

const InfoTooltip: React.FC<InfoTooltipProps> = ({ title }) => (
  <Tooltip title={title} arrow>
    <InfoOutlinedIcon className="info-tooltip-icon" fontSize="small" />
  </Tooltip>
);

export default InfoTooltip;
