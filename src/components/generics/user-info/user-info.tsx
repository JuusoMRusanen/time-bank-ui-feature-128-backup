import React from "react";
import { Avatar, Box, Typography } from "@material-ui/core";
import useUserInfoStyles from "styles/generics/user-info/user-info";
import { selectPerson } from "features/person/person-slice";
import { useAppSelector } from "app/hooks";

/**
 * User info component
 */
const UserInfo: React.FC = () => {
  const classes = useUserInfoStyles();
  const { person } = useAppSelector(selectPerson);

  if (!person) {
    return null;
  }

  /**
   * Renders the username section 
   */
  const renderUsername = () => {
    return (
      <>
        <Avatar
          alt={ `${person.firstName} ${person.lastName}` }
          className={ classes.avatar }
        >
          { person.firstName.charAt(0) }
        </Avatar>
        <Box style={{ paddingLeft: 10 }}>
          <Typography variant="h1">
            { `${person.firstName} ${person.lastName}` }
          </Typography>
          <Typography
            variant="body1"
            style={{ color: "rgba(0,0,0,0.6)" }}
          >
            { person.email }
          </Typography>
        </Box>
      </>
    );
  };

  /**
   * Component render
   */
  return (
    <Box className={ classes.root }>
      <Box className={ classes.userNameContainer }>
        { renderUsername() }
      </Box>
    </Box>
  );
};

export default UserInfo;