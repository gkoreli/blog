// A fixed-concurrency, closed-loop HTTP/1.1 client. Every response is checked.
#include <arpa/inet.h>
#include <math.h>
#include <netinet/in.h>
#include <pthread.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/socket.h>
#include <time.h>
#include <unistd.h>

static double deadline;
static double now(void) { struct timespec t; clock_gettime(CLOCK_MONOTONIC,&t); return t.tv_sec+t.tv_nsec/1e9; }
struct job { int port, status, failures; const char *request,*expected; size_t expected_len; unsigned long long requests,hist[256]; };
static void *worker(void *arg) {
  struct job *j=arg;
  int fd=socket(AF_INET,SOCK_STREAM,0);
  struct timeval timeout={10,0};
  setsockopt(fd,SOL_SOCKET,SO_RCVTIMEO,&timeout,sizeof(timeout));
  setsockopt(fd,SOL_SOCKET,SO_SNDTIMEO,&timeout,sizeof(timeout));
  struct sockaddr_in addr={0}; addr.sin_family=AF_INET;addr.sin_port=htons(j->port);addr.sin_addr.s_addr=htonl(INADDR_LOOPBACK);
  if(fd<0||connect(fd,(struct sockaddr*)&addr,sizeof(addr))!=0){j->failures++;if(fd>=0)close(fd);return NULL;}
  while(now()<deadline){
    double start=now();size_t sent=0,total=strlen(j->request);
    while(sent<total){ssize_t n=send(fd,j->request+sent,total-sent,0);if(n<=0){j->failures++;goto done;}sent+=(size_t)n;}
    char response[131072];int used=0,header=-1,length=-1,status=0;
    while(1){
      ssize_t n=recv(fd,response+used,sizeof(response)-(size_t)used-1,0);
      if(n<=0){j->failures++;goto done;}
      used+=(int)n;response[used]=0;
      if(header<0){
        char *end=strstr(response,"\r\n\r\n");
        if(end){
          header=(int)(end-response)+4;
          char *cl=strcasestr(response,"\r\ncontent-length:");
          if(!cl||cl>=end||sscanf(response,"HTTP/1.1 %d",&status)!=1){j->failures++;goto done;}
          length=atoi(cl+17);
        }
      }
      if(header>=0&&used>=header+length)break;
      if(used>=(int)sizeof(response)-1){j->failures++;goto done;}
    }
    if(status!=j->status||length!=(int)j->expected_len||used!=header+length||memcmp(response+header,j->expected,j->expected_len)!=0){j->failures++;goto done;}
    double us=(now()-start)*1e6;
    int bucket=us<=1?0:(int)ceil(log2(us)*8);
    if(bucket>255)bucket=255;
    j->hist[bucket]++;j->requests++;
  }
done: close(fd);return NULL;
}
static char *read_file(const char *path,size_t *length){
  FILE *f=fopen(path,"rb");if(!f)return NULL;
  fseek(f,0,SEEK_END);long n=ftell(f);rewind(f);if(n<0){fclose(f);return NULL;}
  char *s=calloc((size_t)n+1,1);if(!s){fclose(f);return NULL;}
  if(fread(s,1,(size_t)n,f)!=(size_t)n){fclose(f);free(s);return NULL;}
  fclose(f);*length=(size_t)n;return s;
}
int main(int argc,char **argv){
  if(argc!=8)return 2;
  int port=atoi(argv[1]),concurrency=atoi(argv[2]),status=atoi(argv[6]);double seconds=atof(argv[3]);
  if(concurrency<1||concurrency>128||seconds<=0)return 2;
  size_t request_len=0,expected_len=0;char *request=read_file(argv[4],&request_len),*expected=read_file(argv[5],&expected_len);
  if(!request||!expected||request_len!=strlen(request))return 2;
  pthread_t threads[128];struct job jobs[128]={0};double start=now();deadline=start+seconds;
  for(int i=0;i<concurrency;i++){jobs[i].port=port;jobs[i].status=status;jobs[i].request=request;jobs[i].expected=expected;jobs[i].expected_len=expected_len;if(pthread_create(&threads[i],NULL,worker,&jobs[i])!=0)return 3;}
  unsigned long long requests=0,hist[256]={0};int failures=0;
  for(int i=0;i<concurrency;i++){pthread_join(threads[i],NULL);requests+=jobs[i].requests;failures+=jobs[i].failures;for(int k=0;k<256;k++)hist[k]+=jobs[i].hist[k];}
  double elapsed=now()-start;FILE *out=fopen(argv[7],"w");if(!out)return 2;
  fprintf(out,"{\"requests\":%llu,\"seconds\":%.9f,\"rps\":%.3f,\"failures\":%d,\"histogram_upper_us\":[",requests,elapsed,requests/elapsed,failures);
  for(int k=0;k<256;k++)fprintf(out,"%s[%.6f,%llu]",k?",":"",pow(2,k/8.0),hist[k]);
  fprintf(out,"]}\n");fclose(out);free(request);free(expected);return failures?1:0;
}
