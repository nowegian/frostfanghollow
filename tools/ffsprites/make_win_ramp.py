import numpy as np
def ramp(h,w,f):
  def sm(x):
    t=np.clip(x/f,0,1);return t*t*(3-2*t)
  y=np.minimum(np.arange(h),np.arange(h)[::-1]);x=np.minimum(np.arange(w),np.arange(w)[::-1])
  return np.outer(sm(y),sm(x))
