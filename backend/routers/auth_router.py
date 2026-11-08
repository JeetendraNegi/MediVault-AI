import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import User, FamilyProfile
from schemas import UserRegister, UserLogin, TokenResponse, UserResponse
from auth import get_password_hash, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=TokenResponse)
def register(user_data: UserRegister, db: Session = Depends(get_db)):
    clean_email = user_data.email.strip().lower()
    existing = db.query(User).filter(User.email == clean_email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user_id = f"u-{uuid.uuid4().hex[:8]}"
    new_user = User(
        id=user_id,
        email=clean_email,
        password_hash=get_password_hash(user_data.password.strip()),
        full_name=user_data.full_name.strip()
    )
    db.add(new_user)
    
    # Create default 'Self' family profile for primary account user
    self_profile = FamilyProfile(
        id=f"p-self-{uuid.uuid4().hex[:6]}",
        user_id=user_id,
        name=user_data.full_name.strip(),
        relationship="Self",
        avatar_url=f"https://api.dicebear.com/7.x/avataaars/svg?seed={user_data.full_name}"
    )
    db.add(self_profile)
    db.commit()

    token = create_access_token({"sub": user_id})
    return TokenResponse(
        access_token=token,
        user_id=user_id,
        email=new_user.email,
        full_name=new_user.full_name
    )

@router.post("/login", response_model=TokenResponse)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    clean_email = credentials.email.strip().lower()
    clean_password = credentials.password.strip()
    user = db.query(User).filter(User.email == clean_email).first()
    
    pwd_match = verify_password(clean_password, user.password_hash) if user else False
    print(f"[LOGIN ATTEMPT] Email: '{clean_email}', User Found: {user is not None}, Password Match: {pwd_match}")

    if not user or not pwd_match:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )

    token = create_access_token({"sub": user.id})
    return TokenResponse(
        access_token=token,
        user_id=user.id,
        email=user.email,
        full_name=user.full_name
    )

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
