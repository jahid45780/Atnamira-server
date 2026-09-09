
/* eslint-disable @typescript-eslint/no-explicit-any */
import passport, { Profile } from "passport";
import { Strategy as googleStrategy, VerifyCallback } from "passport-google-oauth2";
import { Strategy as localStrategy } from "passport-local";
import  bcryptjs  from 'bcrypt';
import { User } from "../modules/user/user.model";
import { Role } from "../modules/user/user.interface";
import { envVers } from "./env";



passport.use(
    new  localStrategy ({
       usernameField:"email",
       passwordField:"password"
    }, async (email:string, password:string, done:VerifyCallback)=>{
         try {
            
            const isUserExist  = await User.findOne({email})
            
            if(!isUserExist){
                return done (null, false ,{message:"user does not exist"})
             }

              // VERIFY CHECK
        // if (!isUserExist.IsVerified) {
        //   return done(null, false, {
        //     message: "User is not verified",
        //   });
        // }
             const isPasswordMatched =  await bcryptjs.compare(password as string , isUserExist.password as string )
             if(!isPasswordMatched){
                return done (null, false, {message:"password  does  not  match"} )
             }

               return done(null, isUserExist)

         } catch (error) {
            console.log(error);
             done(error)
         }
    })
)

passport.use(
    new googleStrategy ({
         clientID:envVers.GOOGLE_CLIENT_ID!,
         clientSecret:envVers.GOOGLE_CLIENT_SECRET!,
         callbackURL:envVers.GOOGLE_CALLBACK_URL!
    }, async (accessToken:string, refreshToken:string, profile:Profile, done:VerifyCallback )=>{
        try {
            const email = profile.emails?.[0].value
            if(!email){
                return done(null, false,{message:"email not found"})
            }

            let user = await User.findOne({email})

            

            if(!user){
                user = await User.create({
                    email,
                    name:profile.displayName,
                    picture:profile.photos?.[0].value,
                    role:Role.USER,
                    IsVerified:true,
                    auths:[{
                       provider:"google",
                       providerID:profile.id
                    }]
                })
            }

            return done (null, user)
                
        } catch (error) {
            console.log('google Strategy error', error);

            return done ( error)
        }
    } )
)


// eslint-disable-next-line @typescript-eslint/no-explicit-any
passport.serializeUser((user:any, done:(err:any, id?:unknown)=>void)=>{
    done(null, user._id)
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
passport.deserializeUser( async (id:string, done:any)=>{
      try {
        const user = await User.findById(id)
        done(null, user)
      } catch (error) {
         done(error)
      }
})