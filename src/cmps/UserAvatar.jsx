import { generateUserColor } from '../services/util.service'

export function UserAvatar({
  user,
  src,
  fullname = '',
  alt = 'User avatar',
  title = '',
  className = '',
  userId,
  ...props
}) {

  if (user) {
    src = src || user.imgUrl
    fullname = fullname || user.fullname || user.fullName || ''
    userId = userId || user._id
  }


  const getInitials = (name = '') => {
    const words = name.trim().split(' ')
    if (!words[0]) return '??'
    if (words.length === 1) return words[0][0].toUpperCase()
    return (words[0][0] + words[1][0]).toUpperCase()
  }
  
  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        title={title || fullname}
        className={`user-avatar ${className}`}
        aria-hidden="true"
        {...props}
      />
    )
  }

  if (fullname === 'Unassigned') {
    return (
      <img
        src="https://cdn.monday.com/icons/dapulse-person-column.svg"
        className={`person-icon-small ${className}`}
        alt=""
        aria-hidden="true"
        {...props}
      />
    )
  }

  const backgroundColor = generateUserColor(userId);

  return (
    <div
      className={`user-avatar fallback-avatar ${className}`}
      title={title || fullname}
      style={{ backgroundColor, color: 'white' }}
      {...props}
    >
      {getInitials(fullname)}
    </div>
  )
}